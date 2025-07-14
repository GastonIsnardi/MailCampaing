import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import schema from "/opt/db/schema/email.joi";
import { ejecutarLambda } from "/opt/aws/Lambda/ejecutarLambda";
import { logger } from "/opt/db/utils/powertools";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info("Evento recibido de DynamoDB", { event });
  try {
    const { body } = event;
    const parsedBody = JSON.parse(body || "{}");

    // Validamos el objeto completo, no solo `destinatarios`
    const validation = schema.validate(parsedBody, { abortEarly: false });

    if (validation.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Error de validación",
          details: validation.error.details.map((d) => d.message),
        }),
      };
    }
    const contador = validation.value.destinatarios.length;
    const response = await ejecutarLambda(process.env.saveInDynamodDB || "", validation.value);
    logger.info("Response", { response });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Emails validados correctamente ${contador}` }),
    };
  } catch (error) {
    logger.error("Error:", { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error al procesar los emails" }),
    };
  }
};
