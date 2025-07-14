import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, ProjectionType, StreamViewType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

interface DynamoStackProps extends StackProps {
  envType: string;
  projectName: string;
}

export class DynamoConstruct extends Construct {
  public readonly enersaEmailTable: Table;

  constructor(scope: Construct, id: string, props?: DynamoStackProps) {
    super(scope, id);

    this.enersaEmailTable = new Table(this, `EnersaEmailTable-${props?.projectName}-${props?.envType}`, {
      tableName: `EnersaEmailTable-${props?.projectName}-${props?.envType}`,
      partitionKey: {
        name: "pk",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // Cambiar a RETAIN en producción
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // GSI1: para acceder por ID y emailID
    this.enersaEmailTable.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "id", type: AttributeType.STRING },
      sortKey: { name: "tipo", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    // GSI2: para acceder por emailID y tipo
    this.enersaEmailTable.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: { name: "emailID", type: AttributeType.STRING },
      sortKey: { name: "tipo", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    // GSI3: para acceder por id y status
    this.enersaEmailTable.addGlobalSecondaryIndex({
      indexName: "GSI3",
      partitionKey: { name: "id", type: AttributeType.STRING },
      sortKey: { name: "status", type: AttributeType.STRING },
    });
    this.enersaEmailTable.addGlobalSecondaryIndex({
      indexName: "GSI4",
      partitionKey: { name: "destinatario", type: AttributeType.STRING },
      sortKey: { name: "tipo", type: AttributeType.STRING },
    });
  }
}
