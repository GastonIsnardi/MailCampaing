import { Construct } from "constructs";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Code, Runtime } from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import type { Queue } from "aws-cdk-lib/aws-sqs/lib";

interface DynamoDBProps extends cdk.StackProps {
  projectName: string;
  sqs: Queue;
}

export class DynamoDBConstruct extends Construct {
  public readonly table: Table;
  public readonly getInfoLambda: lambda.Function;
  public readonly getAllByFechaLambda: lambda.Function;
  public readonly getAllByEstadoLambda: lambda.Function;
  public readonly getByEstadoLambda: lambda.Function;
  public readonly getByFechaLambda: lambda.Function;
  public readonly getAllByEmailLambda: lambda.Function;
  public readonly getByEmailLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: DynamoDBProps) {
    super(scope, id);

    this.table = new Table(this, `${props.projectName}-email-table`, {
      tableName: `${props.projectName}-email-table`,
      partitionKey: { name: "emailId", type: AttributeType.STRING },
      sortKey: { name: "estado", type: AttributeType.STRING },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST, // Facturación por solicitud
    });
    // Función Lambda para el cronjob (deberás implementar el handler)
    const cronHandler = new lambda.Function(this, `${props.projectName}-cron`, {
      functionName: `${props.projectName}-cron`,
      runtime: Runtime.NODEJS_22_X,
      code: Code.fromAsset("lambda/cron-job"),
      handler: "cron-job.handler",
      environment: {
        TABLENAME: this.table.tableName,
        QUEUE_URL: props.sqs.queueUrl,
      },
    });
    this.getInfoLambda = new lambda.Function(this, `${props.projectName}-get-info`, {
      functionName: `${props.projectName}-get-info`,
      runtime: Runtime.NODEJS_22_X,
      code: Code.fromAsset("lambda/get-info"),
      handler: "get-info.handler",
      environment: {
        TABLENAME: this.table.tableName,
      },
    });
    this.getInfoLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:Scan", "dynamodb:GetItem", "dynamodb:UpdateItem", "dynamodb:PutItem", "dynamodb:DeleteItem", "sqs:SendMessage"],
        resources: [this.table.tableArn, props.sqs.queueArn],
      })
    );
    this.getAllByFechaLambda = new lambda.Function(this, `${props.projectName}-get-all-by-fecha`, {
      functionName: `${props.projectName}-get-all-by-fecha`,
      runtime: Runtime.NODEJS_22_X,
      code: Code.fromAsset("lambda/get-info"),
      handler: "getAllbyFecha.handler",
      environment: {
        TABLENAME: this.table.tableName,
      },
    });
    this.getAllByFechaLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:Scan"],
        resources: [this.table.tableArn],
      })
    );
    this.getAllByEstadoLambda = new lambda.Function(this, "GetAllByEstadoLambda", {
      functionName: `${props.projectName}-get-all-by-estado`,
      runtime: Runtime.NODEJS_22_X,
      code: Code.fromAsset("lambda/get-info"),
      handler: "getAllByEstado.handler",
      environment: {
        TABLENAME: this.table.tableName,
      },
    });
    this.getAllByEstadoLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:Scan"],
        resources: [this.table.tableArn],
      })
    );
    this.getByEstadoLambda = new lambda.Function(this, "GetByEstadoLambda", {
      functionName: `${props.projectName}-get-by-estado`,
      runtime: Runtime.NODEJS_22_X,
      code: Code.fromAsset("lambda/get-info"),
      handler: "getByEstado.handler",
      environment: {
        TABLENAME: this.table.tableName,
      },
    });
    this.getByEstadoLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:Scan"],
        resources: [this.table.tableArn],
      })
    );
    this.getByFechaLambda = new lambda.Function(this, "GetByFechaLambda", {
      functionName: `${props.projectName}-get-by-fecha`,
      runtime: Runtime.NODEJS_22_X,
      code: Code.fromAsset("lambda/get-info"),
      handler: "getByFecha.handler",
      environment: {
        TABLENAME: this.table.tableName,
      },
    });

    this.getByFechaLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:Scan"],
        resources: [this.table.tableArn],
      })
    );
    this.getAllByEmailLambda = new lambda.Function(this, "GetAllByEmailLambda", {
      functionName: `${props.projectName}-get-all-by-email`,
      runtime: Runtime.NODEJS_22_X,
      code: Code.fromAsset("lambda/get-info"),
      handler: "getAllByEmail.handler",
      environment: {
        TABLENAME: this.table.tableName,
      },
    });
    this.getAllByEmailLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:Scan"],
        resources: [this.table.tableArn],
      })
    );
    this.getByEmailLambda = new lambda.Function(this, "GetByEmailLambda", {
      functionName: `${props.projectName}-get-by-email`,
      runtime: Runtime.NODEJS_22_X,
      code: Code.fromAsset("lambda/get-info"),
      handler: "getByEmail.handler",
      environment: {
        TABLENAME: this.table.tableName,
      },
    });
    this.getByEmailLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:Scan"],
        resources: [this.table.tableArn],
      })
    );
    cronHandler.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:Scan", "dynamodb:GetItem", "dynamodb:UpdateItem", "dynamodb:PutItem", "dynamodb:DeleteItem", "sqs:SendMessage"],
        resources: [this.table.tableArn, props.sqs.queueArn],
      })
    );

    // Configurar la regla del cronjob
    new Rule(this, "HourlyCronRule", {
      schedule: Schedule.rate(cdk.Duration.hours(1)),
      targets: [new LambdaFunction(cronHandler)],
    });
  }
}
