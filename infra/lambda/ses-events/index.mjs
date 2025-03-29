import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb"; // <-- Import DynamoDBClient
import { actualizarEstado } from "./actualizarEstado.mjs";

const ddbClient = new DynamoDBClient({ region: "us-east-1" }); // <-- Now it is correctly defined

export async function handler(event) {
  console.log("Evento recibido de SNS:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const snsMessage = JSON.parse(record.Sns.Message);
    console.log("Mensaje de SES:", JSON.stringify(snsMessage, null, 2));
    if (snsMessage.eventType === "Notification") {
      console.log("Correo Notification", snsMessage.mail);
    }

    if (snsMessage.eventType === "Delivery") {
      console.log("Correo entregado exitosamente:", snsMessage.mail);
      console.log("snsMessage.mail.messageId", snsMessage.mail.messageId);

      const emailId = snsMessage.mail.messageId;
      const table = process.env.TABLENAME;

      const input = {
        TableName: table,
        Key: {
          emailId: { S: emailId },
          estado: { S: "pendiente" },
        },
      };

      const commandDynamoDB = new GetItemCommand(input);
      const result = await ddbClient.send(commandDynamoDB);

      const item = result.Item;
      if (!item) {
        console.error("No se encontró el correo en la tabla:", emailId);
        continue;
      }

      await actualizarEstado(emailId, "pendiente", "enviado", item.body.S);
    }
    if (snsMessage.eventType === "Click") {
      console.log("Correo entregado exitosamente:", snsMessage.mail);
      console.log("snsMessage.mail.messageId", snsMessage.mail.messageId);

      const emailId = snsMessage.mail.messageId;
      const table = process.env.TABLENAME;

      const input = {
        TableName: table,
        Key: {
          emailId: { S: emailId },
          estado: { S: "open" },
        },
      };

      const commandDynamoDB = new GetItemCommand(input);
      const result = await ddbClient.send(commandDynamoDB);

      const item = result.Item;
      if (!item) {
        console.error("No se encontró el correo en la tabla:", emailId);
        continue;
      }
      await actualizarEstado(emailId, "open", "click", item.body.S);
      console.log("Correo actualizado a click:", emailId);
    }
    if (snsMessage.eventType === "Open") {
      console.log("Correo entregado exitosamente:", snsMessage.mail);
      console.log("snsMessage.mail.messageId", snsMessage.mail.messageId);

      const emailId = snsMessage.mail.messageId;
      const table = process.env.TABLENAME;

      const input = {
        TableName: table,
        Key: {
          emailId: { S: emailId },
          estado: { S: "enviado" },
        },
      };

      const commandDynamoDB = new GetItemCommand(input);
      const result = await ddbClient.send(commandDynamoDB);

      const item = result.Item;
      if (!item) {
        console.error("No se encontró el correo en la tabla:", emailId);
        continue;
      }
      await actualizarEstado(emailId, "enviado", "open", item.body.S);
      console.log("Correo actualizado a open:", emailId);
    }
  }
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Eventos procesados correctamente" }),
  };
}
