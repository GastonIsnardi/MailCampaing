import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import { SESConstruct } from "./SES/SES";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { CfnConfigurationSet } from "aws-cdk-lib/aws-ses";
import { Topic } from "aws-cdk-lib/aws-sns";
import { lambdaStack } from "./lambda";
import { ApiGateway } from "./api-gateway/api-gateway";

interface ComputedStackProps extends StackProps {
  projectName: string;
  envType: string;
  dynamoTable: Table;
  s3URL: string;
}

export class ComputedStack extends Stack {
  constructor(scope: Construct, id: string, props: ComputedStackProps) {
    super(scope, id, props);
    const ses = new SESConstruct(this, `${props.projectName}-${props.envType}-ses`, {
      projectName: props.projectName,
      envType: props.envType,
    });
    const lambda = new lambdaStack(this, `${props.projectName}-${props.envType}-lambda`, {
      projectName: props.projectName,
      envType: props.envType,
      dynamoTable: props.dynamoTable,
      s3URL: props.s3URL,
      sesConfigurationSet: ses.configurationSet,
      sesTopic: ses.sesTopic,
    });

    const apiGateway = new ApiGateway(this, `${props.projectName}-${props.envType}-api-gateway`, {
      projectName: props.projectName,
      envType: props.envType,
      lambdas: lambda.functions,
    });
  }
}
