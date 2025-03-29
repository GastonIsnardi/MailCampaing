import type * as cdk from "aws-cdk-lib";
import * as ses from "aws-cdk-lib/aws-ses";
import type * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as snsSubscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface s3Props extends cdk.StackProps {
  s3URL: string;
  projectName: string;
  sqsURL: string;
  tableName: string;
  queue: sqs.Queue;
}

export class SESConstruct extends Construct {
  constructor(scope: Construct, id: string, props: s3Props) {
    super(scope, id);

    // Crear un Configuration Set en SES antes de configurar EventDestination
    const configurationSet = new ses.CfnConfigurationSet(this, `${props.projectName}-ses-config`, {
      name: `${props.projectName}-ses-config`,
    });

    // Crear un tema SNS para recibir eventos de SES
    const sesTopic = new sns.Topic(this, `${props.projectName}-ses-topic`, {
      topicName: `${props.projectName}-ses-notifications`,
      displayName: `${props.projectName}-SES Notifications Topic`,
    });

    // Crear una Lambda para recibir eventos de SES
    const sesEventLambda = new lambda.Function(this, `${props.projectName}-ses-events`, {
      functionName: `${props.projectName}-ses-events`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda/ses-events"),
      environment: {
        S3URL: props.s3URL,
        SQSURL: props.sqsURL,
        TABLENAME: props.tableName,
        CONFIGURATION_SET: `${props.projectName}-ses-config`,
      },
    });

    // Permitir que SNS invoque la Lambda
    sesEventLambda.addPermission("AllowSNSInvoke", {
      principal: new iam.ServicePrincipal("sns.amazonaws.com"),
      sourceArn: sesTopic.topicArn,
    });
    sesEventLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
        ],
        resources: ["*"], // Puedes restringir esto a recursos específicos si es necesario
      })
    );

    // Suscribir la Lambda al tema SNS
    sesTopic.addSubscription(new snsSubscriptions.LambdaSubscription(sesEventLambda));

    if (!configurationSet.name) {
      throw new Error("Configuration Set name is undefined");
    }

    // Configurar SES para enviar eventos al tema SNS (depende del Configuration Set)
    const eventDestination = new ses.CfnConfigurationSetEventDestination(this, "SesEventDestination", {
      configurationSetName: configurationSet.name, // Asegurar que use el Configuration Set creado antes
      eventDestination: {
        enabled: true,
        matchingEventTypes: [
          ses.EmailSendingEvent.SEND,
          ses.EmailSendingEvent.DELIVERY,
          ses.EmailSendingEvent.OPEN,
          ses.EmailSendingEvent.CLICK,
        ],
        snsDestination: {
          topicArn: sesTopic.topicArn,
        },
      },
    });

    // Crear una Lambda para enviar correos cuando un mensaje llega a la cola SQS
    const sendEmailLambda = new lambda.Function(this, `${props.projectName}-send-email`, {
      functionName: `${props.projectName}-send-email`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda/send-email"),
      environment: {
        S3URL: props.s3URL,
        SQSURL: props.sqsURL,
        TABLENAME: props.tableName,
        CONFIGURATION_SET: `${props.projectName}-ses-config`,
      },
    });

    // Agregar SQS como trigger de la Lambda
    sendEmailLambda.addEventSource(new lambdaEventSources.SqsEventSource(props.queue));

    // Permitir que la Lambda lea mensajes de la cola
    props.queue.grantConsumeMessages(sendEmailLambda);

    // Otorgar permisos para enviar correos con SES
    sendEmailLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
        ],
        resources: ["*"], // Puedes restringir esto a recursos específicos si es necesario
      })
    );

    // Asegurar que la configuración de eventos de SES se cree después del Configuration Set
    eventDestination.node.addDependency(configurationSet);
  }
}
