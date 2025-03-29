import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

export const handler = async (event) => {
  const { body } = event;
  const { destinatarios, contador } = JSON.parse(body);
  const contadorActual = contador ?? 1;
  console.log("Destinatarios", destinatarios);
  console.log("contadorActual", contadorActual);

  try {
    for (const destinatario of destinatarios) {
      const { url, fechaVencimientos, urlTerminos, email } = destinatario;
      console.log("Destinatario", destinatario);

      const params = {
        QueueUrl: process.env.QUEUE_URL,
        MessageBody: JSON.stringify({
          url,
          fechaVencimientos,
          urlTerminos,
          destinatario: email,
          contador: contadorActual,
        }),
      };

      const command = new SendMessageCommand(params);
      const response = await sqsClient.send(command);
      console.log("Respuesta de SQS", response);
      if (response.MessageId) {
        console.log("Mensaje enviado exitosamente a la cola SQS");
      } else {
        console.error("Error al enviar mensaje a SQS", params);
        throw new Error("Error al enviar mensaje a SQS");
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Mensajes enviados exitosamente a la cola SQS",
      }),
    };
  } catch (error) {
    console.error("Error al enviar mensaje a SQS:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error al procesar la solicitud",
      }),
    };
  }
};
