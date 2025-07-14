import { APIGatewayProxyEvent } from "aws-lambda";
import { EmailService } from "/opt/db/service/EmailService";
import { logger } from "/opt/db/utils/powertools";

const searchType = {
  email: async (email: string) => {
    return await emailService.getEmail(email);
  },
  estado: async (estado: string) => {
    return await emailService.getByEstado(estado);
  },
  fecha: async (fecha: string) => {
    return await emailService.getByFecha(fecha);
  },
  all: async () => {
    return await emailService.getAll();
  },
};

const emailService = new EmailService();
export const handler = async (event: APIGatewayProxyEvent) => {
  logger.info("Evento recibido de API Gateway", { event });
  try {
    const queryStringParameters = event.queryStringParameters;
    if (!queryStringParameters) {
      return {
        statusCode: 400,
        body: "No se proporcionaron parámetros de consulta",
      };
    }
    const { search, data } = queryStringParameters;
    if (!search || !data) {
      return {
        statusCode: 400,
        body: "No se proporcionó un término de búsqueda",
      };
    }
    const emails = await searchType[search as keyof typeof searchType](data);
    if (
      !emails ||
      (Array.isArray(emails) && emails.length === 0) ||
      (typeof emails === "object" && "email" in emails && Array.isArray(emails.email) && emails.email.length === 0)
    ) {
      return {
        statusCode: 404,
        body: "No se encontró ningún email",
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(emails),
    };
  } catch (error) {
    logger.error("Error al obtener el email:", error as Error);
    return {
      statusCode: 500,
      body: "Error al obtener el email",
    };
  }
};
