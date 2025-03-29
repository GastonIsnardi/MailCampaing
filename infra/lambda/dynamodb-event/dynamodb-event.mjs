import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

export const handler = async (event) => {
  try {
    const table = process.env.DYNAMODB_TABLE;
    const dlq = process.env.DLQ;
    const client = new DynamoDBClient();
    const input = {
      TableName: table,
      Key: {
        fecha: "pendiente",
      },
    };
    const command = new GetItemCommand(input);
    const response = await client.send(command);
    console.log(response);
    if (response.Items.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No hay eventos pendientes" }),
      };
    }
    for (const item of response.Items) {
      const { email, url, fechaVencimientos, urlTerminos } = item;
      const params = {
        MessageBody: JSON.stringify({ email, url, fechaVencimientos, urlTerminos }),
        QueueUrl: dlq,
      };
      await sqs.sendMessage(params).promise();
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Evento finalizado correctamente" }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error al procesar el evento" }),
    };
  }
};
