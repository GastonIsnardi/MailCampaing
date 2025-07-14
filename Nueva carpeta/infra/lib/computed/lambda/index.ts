import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { layersConstruct } from "./config/layer";
import { lambdasConfig } from "./config/lambdaConfig";
import { addGroupedPoliciesToLambda } from "./policy";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as snsSubscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as ses from "aws-cdk-lib/aws-ses";
import * as sns from "aws-cdk-lib/aws-sns";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda_destinations from "aws-cdk-lib/aws-lambda-destinations";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";

export interface LambdaAPI extends lambda.Function {
  method?: string;
  name?: string;
  apiPath?: string;
  requireAuth?: boolean;
}

interface LambdaStackProps extends cdk.StackProps {
  envType: string;
  projectName: string;
  dynamoTable: cdk.aws_dynamodb.Table;
  s3URL: string;
  sesConfigurationSet: ses.CfnConfigurationSet;
  sesTopic: sns.Topic;
}

export class lambdaStack extends Construct {
  public readonly functions: LambdaAPI[] = [];
  public readonly layers: layersConstruct;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id);

    this.layers = new layersConstruct(this, `LayersConstruct-${props.projectName}`, {
      envType: props.envType,
      projectName: props.projectName,
    });

    const buildLambda = lambdasConfig(props);

    buildLambda.forEach((funcion) => {
      // 1. Crear DLQ si se requiere
      let dlqQueue: sqs.Queue | undefined;
      if (funcion.dlq) {
        dlqQueue = new sqs.Queue(this, `${funcion.functionName}-DLQ`, {
          queueName: `${funcion.functionName}-DLQ-${props.envType}`,
          retentionPeriod: cdk.Duration.days(14),
        });

        // 2. Crear alarma para la DLQ
        new cloudwatch.Alarm(this, `DLQAlarm-${funcion.functionName}`, {
          metric: dlqQueue.metricApproximateNumberOfMessagesVisible(),
          threshold: 1,
          evaluationPeriods: 1,
          alarmDescription: `Mensajes pendientes en DLQ de ${funcion.functionName}`,
          alarmName: `DLQ-${funcion.functionName}-Alarm`,
        });
      }

      // 3. Crear Lambda
      const newLambda: LambdaAPI = new lambda.Function(this, funcion.functionName, {
        ...funcion,
        functionName: funcion.functionName,
        tracing: lambda.Tracing.ACTIVE,
        layers: [this.layers.dbLayer, this.layers.awsSdkLayer],
      });

      // 4. Políticas por servicio
      addGroupedPoliciesToLambda(newLambda, funcion.policiesByService || {});

      // 5. Si tiene dynamoStream
      if (funcion.dynamoStream) {
        newLambda.addEventSource(
          new DynamoEventSource(props.dynamoTable, {
            startingPosition: lambda.StartingPosition.LATEST,
            batchSize: 5,
            bisectBatchOnError: true,
            retryAttempts: 0,
            onFailure: dlqQueue ? new lambda_destinations.SqsDestination(dlqQueue) : undefined,
            filters: [
              lambda.FilterCriteria.filter({
                eventName: ["INSERT", "MODIFY"],
                dynamodb: {
                  NewImage: {
                    enviar: { BOOL: [true] },
                  },
                },
              }),
            ],
          })
        );
      }

      // 6. Si es invocación asíncrona (no stream)
      if (funcion.dlq && !funcion.dynamoStream && dlqQueue) {
        new lambda.EventInvokeConfig(this, `${funcion.functionName}-InvokeConfig`, {
          function: newLambda,
          maxEventAge: cdk.Duration.hours(6),
          retryAttempts: 2,
          onFailure: new lambda_destinations.SqsDestination(dlqQueue),
        });
      }

      // 7. SNS trigger
      if (funcion.SNSInvoke) {
        newLambda.addPermission("AllowSNSInvoke", {
          principal: new iam.ServicePrincipal("sns.amazonaws.com"),
          sourceArn: props.sesTopic.topicArn,
        });
        props.sesTopic.addSubscription(new snsSubscriptions.LambdaSubscription(newLambda));
      }

      // 8. API method/path
      if (funcion.path) newLambda.apiPath = funcion.path;
      if (funcion.method) newLambda.method = funcion.method;

      this.functions.push(newLambda);
    });
  }
}
