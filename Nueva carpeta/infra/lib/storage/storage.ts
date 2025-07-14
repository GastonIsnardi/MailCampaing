import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cdk from "aws-cdk-lib";
import { S3Construct } from "./S3/S3";
import { DynamoConstruct } from "./dynamodb/dynamo";
import { Table } from "aws-cdk-lib/aws-dynamodb";

interface StorageStackProps extends cdk.StackProps {
  projectName: string;
  envType: string;
}

export class StorageStack extends cdk.Stack {
  public readonly dynamoTable: Table;
  public readonly bucket: s3.Bucket;
  public readonly bucketUrl: string;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);
    const bucket = new S3Construct(this, `${props.projectName}-${props.envType}-images`, {
      projectName: props.projectName,
      envType: props.envType,
    });
    this.bucket = bucket.bucket;
    this.bucketUrl = bucket.bucketUrl;
    const dynamo = new DynamoConstruct(this, `${props.projectName}-${props.envType}-dynamo`, {
      projectName: props.projectName,
      envType: props.envType,
    });
    this.dynamoTable = dynamo.enersaEmailTable;
  }
}
