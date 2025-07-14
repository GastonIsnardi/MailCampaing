import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { Email } from "/opt/db/model/email";
import { personalizarEmailHtml } from "./personalizarEmailHtml";
import { logger } from "/opt/db/utils/powertools";
import { captureAWSv3Client } from "aws-xray-sdk-core";

const sesClient = captureAWSv3Client(new SESClient({ region: "us-east-1" }));

export const enviarMail = async (email: Email) => {
  logger.info("Enviando email", { email });
  try {
    const emailHtml = personalizarEmailHtml({
      url: email.getContent().url,
      fechaVencimientos: email.getContent().fechaVencimientos || [],
      urlTerminos: email.getContent().urlTerminos || "",
    });

    logger.info("CONFIGURATION_SET_NAME", { CONFIGURATION_SET_NAME: process.env.CONFIGURATION_SET_NAME });

    const command = new SendEmailCommand({
      Source: process.env.FROM_EMAIL || "test@email.enersa.com.ar",
      Destination: {
        ToAddresses: [email.getDestinatario()],
      },
      Message: {
        Subject: { Data: "Test" },
        Body: {
          Html: {
            Data: emailHtml,
          },
        },
      },
      ConfigurationSetName: process.env.CONFIGURATION_SET_NAME || "default",
    });
    const result = await sesClient.send(command);
    return result.MessageId;
  } catch (error) {
    logger.error("Error al enviar el email", { error });
    throw error;
  }
};
