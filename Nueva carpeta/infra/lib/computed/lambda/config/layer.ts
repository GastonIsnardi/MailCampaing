import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "node:path";

interface layersConstructProps {
  envType: string;
  projectName: string;
}

export class layersConstruct extends Construct {
  public readonly dbLayer: lambda.LayerVersion;
  public readonly awsSdkLayer: lambda.LayerVersion;
  constructor(scope: Construct, id: string, props: layersConstructProps) {
    super(scope, id);
    this.dbLayer = new lambda.LayerVersion(this, `DbLayer-${props.projectName}`, {
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../../../backend/dist/layer/db")),
      compatibleRuntimes: [lambda.Runtime.NODEJS_22_X],
    });
    this.awsSdkLayer = new lambda.LayerVersion(this, `AwsSdkLayer-${props.projectName}`, {
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../../../backend/dist/layer/aws")),
      compatibleRuntimes: [lambda.Runtime.NODEJS_22_X],
    });

    this.dbLayer.addPermission(`LayerVersionPermission-${props.projectName}`, {
      accountId: "*",
      organizationId: props.envType === "PRO" ? undefined : undefined,
    });
    this.awsSdkLayer.addPermission(`LayerVersionPermission-${props.projectName}`, {
      accountId: "*",
      organizationId: props.envType === "PRO" ? undefined : undefined,
    });
  }
}
