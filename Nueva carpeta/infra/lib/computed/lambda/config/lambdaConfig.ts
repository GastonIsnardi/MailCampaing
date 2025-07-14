import { aws_lambda, Duration } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import * as ses from "aws-cdk-lib/aws-ses";

interface lambdaConfig extends aws_lambda.FunctionProps {
  functionName: string;
  policiesByService?: Record<string, { actions: string[]; resources: string[] }>;
  dynamoStream?: boolean;
  SNSInvoke?: boolean;
  method?: string;
  path?: string;
  dlq?: boolean;
}
interface lambdaConfigProps {
  envType: string;
  projectName: string;
  dynamoTable: cdk.aws_dynamodb.Table;
  s3URL: string;
  sesConfigurationSet: ses.CfnConfigurationSet;
}

export const lambdasConfig = (props: lambdaConfigProps) => {
  const lambdaConfigs: lambdaConfig[] = [
    {
      functionName: `validateAndDispatchEmails-${props.projectName}-${props.envType}`,
      handler: "validateAndDispatchEmails/validateAndDispatchEmails.handler",
      code: aws_lambda.Code.fromAsset("../backend/dist/lambda"),
      runtime: aws_lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(60),
      memorySize: 1024,
      method: "POST",
      path: "validateAndDispatchEmails",
      environment: {
        NODE_ENV: props.envType,
        saveInDynamodDB: `saveInDynamodDB-${props.projectName}-${props.envType}`,
      },
      policiesByService: {
        lambda: {
          actions: ["lambda:InvokeFunction"],
          resources: ["*"],
        },
      },
    },
    {
      functionName: `saveInDynamodDB-${props.projectName}-${props.envType}`,
      handler: "saveInDynamodDB/saveInDynamodDB.handler",
      code: aws_lambda.Code.fromAsset("../backend/dist/lambda"),
      runtime: aws_lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      dlq: true,
      memorySize: 128,
      environment: {
        NODE_ENV: props.envType,
        dynamoTable: props.dynamoTable.tableName,
      },
      policiesByService: {
        dynamodb: {
          actions: ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"],
          resources: [props.dynamoTable.tableArn],
        },
      },
    },
    {
      functionName: `processDynamoDB-${props.projectName}-${props.envType}`,
      handler: "processDynamoDB/processDynamoDB.handler",
      code: aws_lambda.Code.fromAsset("../backend/dist/lambda"),
      runtime: aws_lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      memorySize: 128,
      dlq: true,
      environment: {
        NODE_ENV: props.envType,
        dynamoTable: props.dynamoTable.tableName,
        S3URL: props.s3URL,
        CONFIGURATION_SET_NAME: `${props.projectName}-${props.envType.toLowerCase()}-ses-config`,
      },
      policiesByService: {
        dynamodb: {
          actions: ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"],
          resources: [
            props.dynamoTable.tableArn,
            props.dynamoTable.tableArn + "/index/GSI1",
            props.dynamoTable.tableArn + "/index/GSI2",
            props.dynamoTable.tableArn + "/index/GSI3",
            props.dynamoTable.tableArn + "/index/GSI4",
          ],
        },
        stream: {
          actions: ["dynamodb:GetRecords", "dynamodb:GetShardIterator", "dynamodb:DescribeStream", "dynamodb:GetRecords"],
          resources: [props.dynamoTable.tableArn],
        },
        ses: {
          actions: ["ses:SendEmail", "ses:SendRawEmail"],
          resources: ["*"],
        },
      },
      dynamoStream: true,
    },
    {
      functionName: `processEventSES-${props.projectName}-${props.envType}`,
      handler: "processEventSES/processEventSES.handler",
      code: aws_lambda.Code.fromAsset("../backend/dist/lambda"),
      runtime: aws_lambda.Runtime.NODEJS_22_X,
      dlq: true,
      environment: {
        NODE_ENV: props.envType,
        dynamoTable: props.dynamoTable.tableName,
        CONFIGURATION_SET_NAME: `${props.projectName}-${props.envType.toLowerCase()}-ses-config`,
      },
      SNSInvoke: true,
      policiesByService: {
        ses: {
          actions: ["ses:SendEmail", "ses:SendRawEmail"],
          resources: ["*"],
        },
        dynamodb: {
          actions: ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"],
          resources: [
            props.dynamoTable.tableArn,
            props.dynamoTable.tableArn + "/index/GSI1",
            props.dynamoTable.tableArn + "/index/GSI2",
            props.dynamoTable.tableArn + "/index/GSI3",
            props.dynamoTable.tableArn + "/index/GSI4",
          ],
        },
      },
    },
    {
      functionName: `getInfo-${props.projectName}-${props.envType}`,
      handler: "getInfo/getInfo.handler",
      code: aws_lambda.Code.fromAsset("../backend/dist/lambda"),
      runtime: aws_lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(60),
      memorySize: 2048,
      method: "GET",
      path: "getInfo",
      environment: {
        NODE_ENV: props.envType,
        dynamoTable: props.dynamoTable.tableName,
      },
      policiesByService: {
        dynamodb: {
          actions: ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan", "dynamodb:UpdateItem"],
          resources: [
            props.dynamoTable.tableArn,
            props.dynamoTable.tableArn + "/index/GSI1",
            props.dynamoTable.tableArn + "/index/GSI2",
            props.dynamoTable.tableArn + "/index/GSI3",
            props.dynamoTable.tableArn + "/index/GSI4",
          ],
        },
      },
    },
  ];
  return lambdaConfigs;
};
