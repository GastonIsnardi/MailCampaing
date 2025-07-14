import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { EmailService } from "/opt/db/service/EmailService";
import { logger } from "/opt/db/utils/powertools";

interface saveInDynamodDBProps {
  destinatarios: [
    {
      email: string;
      url: string;
      urlTerminos: string;
      fechaVencimientos: { fecha: string; nroCuota: number }[];
    }
  ];
}

export const handler = async (event: saveInDynamodDBProps): Promise<APIGatewayProxyResult> => {
  logger.info("Evento recibido de DynamoDB", { event });
  try {
    const { destinatarios } = event;
    logger.info("Destinatarios", { destinatarios });
    const emailService = new EmailService();

    for (const destinatario of destinatarios) {
      logger.info("Destinatario", { destinatario });
      const email = await emailService.crearEmail(destinatario.email, {
        url: destinatario.url,
        urlTerminos: destinatario.urlTerminos,
        fechaVencimientos: destinatario.fechaVencimientos,
      });
      logger.info("Email", { email });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Emails guardados correctamente" }),
    };
  } catch (error) {
    logger.error("Error:", { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error al guardar los emails" }),
    };
  }
};
