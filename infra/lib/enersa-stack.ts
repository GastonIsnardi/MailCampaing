import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { SESConstruct } from "./SES-construct/SES-construct";
import { S3Construct } from "./S3-construct/S3-construct";
import { SQSConstruct } from "./SQS-construct/SQS-construct";
import { DynamoDBConstruct } from "./DynamoDB-construct/DynamoDB-construct";
import { ApiGatewayConstruct } from "./API-GATEWAY-construct/API-GATEWAY-construct";

// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface EnersaStackProps extends cdk.StackProps {
  stage: string;
}

export class EnersaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EnersaStackProps) {
    super(scope, id, props);
    const sqs = new SQSConstruct(this, `${props.stage}-sqs`, {
      projectName: `enersa-${props.stage}`,
    });
    const s3 = new S3Construct(this, `${props.stage}-s3`, {
      projectName: `enersa-${props.stage}`,
    });
    const dynamoDB = new DynamoDBConstruct(this, `${props.stage}-dynamodb`, {
      projectName: `enersa-${props.stage}`,
      sqs: sqs.queue,
    });
    new SESConstruct(this, `${props.stage}-ses`, {
      s3URL: s3.bucketUrl,
      projectName: `enersa-${props.stage}`,
      sqsURL: sqs.queue.queueUrl,
      tableName: dynamoDB.table.tableName,
      queue: sqs.queue,
    });
    new ApiGatewayConstruct(this, `${props.stage}-api`, {
      stageName: props.stage,
      projectName: `enersa-${props.stage}`,
      enviarMailsLambda: sqs.lambdaFunction,
      getInfoLambda: dynamoDB.getInfoLambda,
      getAllByFechaLambda: dynamoDB.getAllByFechaLambda,
      getAllByEstadoLambda: dynamoDB.getAllByEstadoLambda,
      getByEstadoLambda: dynamoDB.getByEstadoLambda,
      getByFechaLambda: dynamoDB.getByFechaLambda,
      getAllByEmailLambda: dynamoDB.getAllByEmailLambda,
      getByEmailLambda: dynamoDB.getByEmailLambda,
    });
  }
}
