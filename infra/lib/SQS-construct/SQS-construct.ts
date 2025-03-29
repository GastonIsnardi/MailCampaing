import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";

interface SQSProps extends cdk.StackProps {
  projectName: string;
}

export class SQSConstruct extends Construct {
  public readonly queue: sqs.Queue;
  public readonly deadLetterQueue: sqs.Queue;
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: SQSProps) {
    super(scope, id);

    // Crear el Dead Letter Queue (DLQ)
    this.deadLetterQueue = new sqs.Queue(this, `${props.projectName}-dlq`, {
      queueName: `${props.projectName}-dlq`,
      retentionPeriod: cdk.Duration.days(14), // Retención de mensajes por 14 días
    });

    // Crear la cola principal con referencia al DLQ
    this.queue = new sqs.Queue(this, `${props.projectName}-main-queue`, {
      queueName: `${props.projectName}-main-queue`,
      visibilityTimeout: cdk.Duration.seconds(30),
      deliveryDelay: cdk.Duration.seconds(10), // Agregar un delay de 10 segundos
      deadLetterQueue: {
        queue: this.deadLetterQueue,
        maxReceiveCount: 3, // Número máximo de intentos antes de enviar al DLQ
      },
    });

    this.lambdaFunction = new lambda.Function(this, `${props.projectName}-sqs-processor`, {
      functionName: `${props.projectName}-send-sqs-event`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda/send-sqsEvent"), // Asegúrate de tener una carpeta 'lambda' con tu código
      timeout: cdk.Duration.seconds(30),
      environment: {
        QUEUE_URL: this.queue.queueUrl,
      },
    });
    this.queue.grantSendMessages(this.lambdaFunction);
  }
}
