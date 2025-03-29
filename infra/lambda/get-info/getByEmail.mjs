import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import orderBy from "./orderby.mjs";

const ddbClient = new DynamoDBClient({ region: "us-east-1" });

export const handler = async (event) => {
  try {
    const { email } = event.queryStringParameters;
    const input = {
      TableName: process.env.TABLENAME,
    };
    const command = new ScanCommand(input);
    const result = await ddbClient.send(command);
    const emails = result.Items.map((item) => {
      return {
        estado: item.estado.S,
        body: item.body.S,
      };
    });
    const emailsFiltrados = orderBy(emails).body.email[email];
    if (!emailsFiltrados) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No hay información para el email seleccionado" }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Información obtenida exitosamente", emailsFiltrados }),
    };
  } catch (error) {
    console.error("Error al obtener la información:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error al obtener la información" }),
    };
  }
};
