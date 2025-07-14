import { SNSEvent } from "aws-lambda";
import { EmailService } from "/opt/db/service/EmailService";
import { Status } from "/opt/db/const/enum";
import { logger } from "/opt/db/utils/powertools";

const emailService = new EmailService();

const sesEvent = [
  "Delivery",
  "Created",
  "Open",
  "Click",
  "Send",
  "Bounce",
  "Complaint",
  "Reject",
  "DeliveryDelay",
  "Subscription",
  "RenderingFailure",
];

export const handler = async (event: SNSEvent) => {
  logger.info("Evento recibido de SNS:", { event });
  for (const record of event.Records) {
    const snsMessage = JSON.parse(record.Sns.Message);
    logger.info("Mensaje de SNS:", JSON.stringify(snsMessage, null, 2));
    logger.info("Evento SES:", snsMessage.eventType);
    if (typeof snsMessage.eventType === "string" && sesEvent.includes(snsMessage.eventType)) {
      const EmailStatus = Status[snsMessage.eventType.toUpperCase() as keyof typeof Status];
      await emailService.updateEmailLogStatus(snsMessage.mail.messageId, EmailStatus, "Evento SES + " + snsMessage.eventType);
    } else {
      console.error(`Tipo de evento desconocido: ${snsMessage.eventType}`);
    }
  }
};
