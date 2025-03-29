import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import orderBy from "./orderby.mjs";

const ddbClient = new DynamoDBClient({ region: "us-east-1" });

export const handler = async (event) => {
  try {
    const tableName = process.env.TABLENAME;
    const { estado } = event.queryStringParameters;
    if (!estado) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "El estado es requerido" }),
      };
    }
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
        estado: item.estado.S,
        body: item.body.S,
      };
    });
    console.log(emails);
    const estados = orderBy(emails).estado;
    console.log(estados);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Información obtenida exitosamente", estados }),
    };
  } catch (error) {
    console.error("Error al obtener la información:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error al obtener la información" }),
    };
  }
};
