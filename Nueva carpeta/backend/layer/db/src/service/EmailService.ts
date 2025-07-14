import { EmailLogEntity, EmailMainEntity } from "../entity/Email.entity";
import { Email } from "../model/email";
import { Status } from "../const/enum";
import { AutoLogger } from "../decorators/AutoLogger";
import { logger } from "../utils/powertools";

@AutoLogger
export class EmailService {
  async crearEmail(email: string, content: { url: string; urlTerminos: string; fechaVencimientos: { fecha: string; nroCuota: number }[] }) {
    try {
      const emailEntity = await EmailMainEntity.create({
        id: crypto.randomUUID(),
        destinatario: email,
        status: Status.MAIN,
        tipo: "main",
        enviar: true,
        contador: 0,
        contentUrl: content.url,
        contentUrlTerminos: content.urlTerminos,
        contentFechas: content.fechaVencimientos.map((fecha) => ({
          fecha: fecha.fecha,
          nroCuota: fecha.nroCuota.toString(),
        })),
        receivedAt: new Date().toISOString().split("T")[0],
      }).go();
      return emailEntity;
    } catch (error) {
      logger.error("Error al crear el email", { error });
      throw error;
    }
  }

  async enviarEmailLog(id: string, emailID: string, status: Status, comentario: string) {
    logger.info("Enviando log", { id, emailID, status, comentario });
    try {
      const existeMain = await EmailMainEntity.query.byIdStatus({ id: id, tipo: "main" }).go();
      if (existeMain.data.length === 0) {
        throw new Error("No existe el email");
      }
      const existeLog = await EmailLogEntity.query.byEmailID({ emailID: id, tipo: "log" }).go();
      if (existeLog.data.length > 0) {
        return existeLog;
      }
      const params = EmailLogEntity.create({
        id: id,
        status: status.toUpperCase() as Status,
        tipo: "log",
        emailID: emailID || "",
        comentario: comentario || "",
        receivedAt: new Date().toISOString().split("T")[0],
      }).params();
      logger.info("Params", { params });
      const emailLogEntity = await EmailLogEntity.create({
        id: id,
        status: status.toUpperCase() as Status,
        tipo: "log",
        emailID: emailID || "",
        comentario: comentario || "",
        receivedAt: new Date().toISOString().split("T")[0],
      }).go();
      return emailLogEntity;
    } catch (error) {
      logger.error("Error al crear el log", { error });
      throw error;
    }
  }

  async updateEmail(email: Email, status?: Status, contador?: number, enviar?: boolean) {
    try {
      const existLog = await EmailMainEntity.query.byIdStatus({ id: email.getId(), tipo: "main" }).go();
      logger.info("Exist log", { existLog: existLog.data });
      if (existLog.data.length === 0) {
        throw new Error("No existe log para el email");
      }
      const params = EmailMainEntity.update({ id: existLog.data[0].id, tipo: "main" }).set({ status, contador, enviar }).params();
      logger.info("Params", { params });
      const emailEntity = await EmailMainEntity.update({ id: existLog.data[0].id, tipo: "main" }).set({ status, contador, enviar }).go();
      logger.info("Email entity", { emailEntity: emailEntity });
      return emailEntity;
    } catch (error) {
      logger.error("Error al actualizar el estado del email", { error });
      throw error;
    }
  }

  async getEmails() {
    const emailEntities = await EmailMainEntity.scan.go();
    return emailEntities;
  }

  async getEmailLogs() {
    const emailLogEntities = await EmailLogEntity.scan.go();
    return emailLogEntities;
  }

  async getEmailLogsbyId(id: string) {
    const emailLogEntities = await EmailLogEntity.query.byEmailIDStatus({ id, tipo: "log" }).go();
    return emailLogEntities;
  }
  async updateEmailLogStatus(EmailId: string, status: Status, comentario: string) {
    try {
      const existLog = await EmailLogEntity.query.byEmailID({ emailID: EmailId, tipo: "log" }).go();
      if (existLog.data.length === 0 && status !== Status.SEND) {
        logger.info("No existe log para el email", { EmailId });
        return null;
      }
      logger.info("Actualizando estado del email", { EmailId, status, comentario });
      const emailLogEntity = await EmailLogEntity.update({ emailID: EmailId, tipo: "log" })
        .set({ comentario: comentario, status: status })
        .go();
      if (status === Status.BOUNCE) {
        if (existLog.data.length > 0) {
          await EmailMainEntity.update({ id: existLog.data[0].id, tipo: "main" }).set({ status: status, enviar: true }).go();
        }
      }
      logger.info("Estado del email actualizado", { emailLogEntity: emailLogEntity.data });
      return emailLogEntity;
    } catch (error) {
      logger.error("Error al actualizar el estado del email", { error });
      throw error;
    }
  }
  async getEmail(email: string) {
    const emailArray = [];
    const emails = await EmailMainEntity.query.byDestinatario({ destinatario: email, tipo: "main" }).go();
    if (emails.data.length === 0) {
      return null;
    }
    for (const email of emails.data) {
      const emailLogs = await EmailLogEntity.query.byEmail({ id: email.id, tipo: "log" }).go();
      emailArray.push({
        email: email,
        logs: emailLogs.data,
      });
    }
    return {
      email: emailArray,
    };
  }
  async getByEstado(estado: string) {
    if (!Object.values(Status).includes(estado as Status)) {
      return null;
    }
    const emailArray = [];
    const emails = await EmailMainEntity.scan.go();
    for (const email of emails.data) {
      const emailLogs = await EmailLogEntity.query.byEmail({ id: email.id, tipo: "log" }).go();
      for (const log of emailLogs.data) {
        if (log.status === estado) {
          emailArray.push({
            email: email,
            id: log.id,
            logs: log,
          });
        }
      }
    }
    return emailArray;
  }
  async getByFecha(fecha: string) {
    const emailArray = [];
    const emails = await EmailMainEntity.scan.go();
    for (const email of emails.data) {
      const emailLogs = await EmailLogEntity.query.byEmail({ id: email.id, tipo: "log" }).go();
      for (const log of emailLogs.data) {
        if (log.receivedAt?.includes(fecha)) {
          emailArray.push({
            email: email,
            fecha: log.receivedAt,
            id: log.id,
            logs: log,
          });
        }
      }
    }
    return emailArray;
  }
  async getAll() {
    try {
      const emailArray = [];
      const emails = await EmailMainEntity.scan.go();
      for (const email of emails.data) {
        const emailVector = [];
        const emailLogs = await EmailLogEntity.query.byEmail({ id: email.id, tipo: "log" }).go();
        for (const log of emailLogs.data) {
          emailVector.push({
            email: email,
            id: log.id,
            logs: log,
          });
        }
        emailArray.push(emailVector);
      }
      return emailArray;
    } catch (error) {
      logger.error("Error al obtener todos los emails", { error });
      throw error;
    }
  }
  async getByFechaAndStatus(fecha: string, status: Status) {
    const emailArray = [];
    const emails = await EmailMainEntity.scan.go();
    for (const email of emails.data) {
      const emailLogs = await EmailLogEntity.query.byEmail({ id: email.id, tipo: "log" }).go();
    }
  }
}
