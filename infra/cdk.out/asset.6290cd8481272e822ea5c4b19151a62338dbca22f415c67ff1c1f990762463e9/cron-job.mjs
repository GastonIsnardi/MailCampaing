import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { actualizarEstado } from "./actualizarEstado.mjs";

export const handler = async (event) => {
  try {
    const table = process.env.TABLENAME;
    const ddbClient = new DynamoDBClient({ region: "us-east-1" });
    const sqsClient = new SQSClient({ region: "us-east-1" });

    const input = {
      TableName: table,
      FilterExpression: "estado = :estadoVal",
      ExpressionAttributeValues: {
        ":estadoVal": { S: "pendiente" },
      },
    };

    const command = new ScanCommand(input);
    const result = await ddbClient.send(command);

    if (result.Items.length === 0) {
      console.log("No hay correos en la tabla");
      return;
    }
    for (const item of result.Items) {
      console.log("item", item);
      const body = JSON.parse(item.body.S);
      const emailId = item.emailId.S;
      if (body.estado === "reEnviado") {
        console.log("Correo ya fue enviado, se omite");
        continue;
      }
      console.log("body contador", body.contador++);
      if (body.contador > 5) {
        console.log("Correo ya fue enviado 3 veces, se omite");
        const update = await actualizarEstado(emailId, "pendiente", "ERROR", item.body.S);
        continue;
      }
      const bodyActualizado = {
        ...body,
        contador: body.contador++,
      };
      const params = {
        QueueUrl: process.env.QUEUE_URL,
        MessageBody: JSON.stringify(bodyActualizado),
      };
      const command = new SendMessageCommand(params);
      await sqsClient.send(command);
      console.log("Mensaje enviado a la cola SQS", params.MessageBody);
      const update = await actualizarEstado(emailId, "pendiente", "reEnviado", item.body.S);
      console.log("Correo actualizado a enviado", update);
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Mensajes enviados exitosamente a la cola SQS`,
      }),
    };
  } catch (error) {
    console.error("Error en el cron job:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error en el cron job" }),
    };
  }
};
