import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import orderBy from "./orderby.mjs";

const ddbClient = new DynamoDBClient({ region: "us-east-1" });

export const handler = async (event) => {
  try {
    const tableName = process.env.TABLENAME;
    if (!tableName) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "El nombre de la tabla es requerido" }),
      };
    }
    const body = event.queryStringParameters;
    if (!body.estado) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "El estado es requerido" }),
      };
    }
    const { estado } = body;
    const input = {
      TableName: tableName,
      FilterExpression: "estado = :estadoVal",
      ExpressionAttributeValues: {
        ":estadoVal": { S: estado },
      },
    };
    const command = new ScanCommand(input);
    const result = await ddbClient.send(command);
    const emails = result.Items.map((item) => {
      return {
        emailId: item.emailId.S,
        estado: item.estado.S,
        body: item.body.S,
      };
    });
    console.log(orderBy(emails));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Información obtenida exitosamente", result }),
    };
  } catch (error) {
    console.error("Error al obtener la información:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error al obtener la información", error }),
    };
  }
};
