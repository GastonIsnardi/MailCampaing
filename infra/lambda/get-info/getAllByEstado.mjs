import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import orderBy from "./orderby.mjs";

const ddbClient = new DynamoDBClient({ region: "us-east-1" });

export const handler = async (event) => {
  const tableName = process.env.TABLENAME;
  const input = {
    TableName: tableName,
  };
  const command = new ScanCommand(input);
  const result = await ddbClient.send(command);
  const emails = result.Items.map((item) => {
    return {
      estado: item.estado.S,
      body: item.body.S,
    };
  });
  console.log(orderBy(emails));
  const estados = orderBy(emails).estado;
  console.log(estados);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Información obtenida exitosamente", estados }),
  };
};
