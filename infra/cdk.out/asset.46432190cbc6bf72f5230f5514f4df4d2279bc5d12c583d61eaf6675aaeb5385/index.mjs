import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

export const handler = async (event) => {
  const { body } = event;
  const { destinatarios, contador } = JSON.parse(body);
  const contadorActual = contador ?? 1;
  console.log("Destinatarios", destinatarios);
  console.log("contadorActual", contadorActual);

  try {
    await Promise.all(
      destinatarios.map(async (destinatario) => {
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
        await sqsClient.send(command);
      })
    );

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
