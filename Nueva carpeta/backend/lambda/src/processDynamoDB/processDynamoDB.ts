import { DynamoDBStreamEvent } from "aws-lambda";
import { Email } from "/opt/db/model/email";
import { Status } from "/opt/db/const/enum";
import { enviarMail } from "/opt/aws/SES/enviarMail";
import { EmailService } from "/opt/db/service/EmailService";
import { logger } from "/opt/db/utils/powertools";

export const handler = async (event: DynamoDBStreamEvent) => {
  logger.info("Evento recibido de DynamoDB", { event });
  for (const record of event.Records) {
    const newImage = record.dynamodb?.NewImage;
    if (newImage) {
      const { destinatario, contentUrl, contentFechas, contentUrlTerminos, id, contador } = newImage;
      if (
        !destinatario ||
        !contentUrl ||
        !contentUrlTerminos ||
        !id ||
        !destinatario.S ||
        !contentUrl.S ||
        !contentUrlTerminos.S ||
        !id.S ||
        !contentFechas.L ||
        !contentFechas.L.length ||
        !contador.N
      ) {
        continue;
      }
      const email = new Email(id.S, destinatario.S, Status.PENDING, false, {
        url: contentUrl.S,
        urlTerminos: contentUrlTerminos.S,
        fechaVencimientos:
          contentFechas.L.map((fecha) => {
            return {
              fecha: fecha.M?.fecha?.S || "",
              nroCuota: fecha.M?.nroCuota?.S || "",
            };
          }) || [],
      });
      email.setContador(Number(contador.N));
      logger.info("Email", { email });
      try {
        const emailService = new EmailService();
        if (email.getContador() >= 3) {
          await emailService.updateEmail(email, Status.ERROR, Number(contador.N), false);
          continue;
        }
        const messageId = await enviarMail(email);
        if (!messageId) {
          await emailService.enviarEmailLog(email.getId(), "ERROR", Status.ERROR, "Error al enviar el email");
          if (Number(contador.N) + 1 >= 3) {
            await emailService.updateEmail(email, Status.ERROR, Number(contador.N) + 1, false);
          } else {
            await emailService.updateEmail(email, Status.ERROR, Number(contador.N) + 1, true);
          }
          continue;
        }
        await emailService.updateEmail(email, Status.SEND, Number(contador.N) + 1, false);
        await emailService.enviarEmailLog(email.getId(), messageId, Status.SEND, "Email enviado");
        logger.info("Evento procesado de DynamoDB", { event });
      } catch (error) {
        const emailService = new EmailService();
        await emailService.updateEmail(email, Status.ERROR, Number(contador.N) + 1, true);
        logger.error("Error al enviar el email", { error });
        continue;
      }
    }
  }
};
