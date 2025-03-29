import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"; // <-- Import DynamoDBClient
import { validarCuerpoSolicitud } from "./validarCuerpoSolicitud.mjs";
import { personalizarEmailHtml } from "./personalizarEmailHtml.mjs";
import { validarCamposRequeridos } from "./validarCamposRequeridos.mjs";

// Obtener la ruta del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta al archivo HTML dentro de la carpeta "mail"
const htmlPath = path.join(__dirname, "mail", "estimado_cliente.html");

// Leer el archivo HTML
let emailHtml = fs.readFileSync(htmlPath, "utf8");

// URL del bucket S3 donde están alojadas las imágenes
const bucketUrl = `${process.env.S3URL}/` || "test.test";

// Reemplazar las URLs de imágenes en el HTML con la del bucket S3
emailHtml = emailHtml.replace(/&lt;url_assets&gt;/g, bucketUrl);

// Configurar el cliente de AWS SES y DynamoDB
const ses = new SESv2Client({ region: "us-east-1" });
const ddbClient = new DynamoDBClient({ region: "us-east-1" }); // <-- Now it is correctly defined

export async function handler(event) {
  try {
    const validacionCuerpo = validarCuerpoSolicitud(event);
    if (!validacionCuerpo.isValid) {
      throw new Error("Error al validar el cuerpo de la solicitud");
    }
    console.log("Cantidad de emails", validacionCuerpo.datos.length);
    for (const Email of validacionCuerpo.datos) {
      const { url, fechaVencimientos, urlTerminos, destinatario, contador } = Email;
      const validacionCampos = validarCamposRequeridos({
        url,
        fechaVencimientos,
        urlTerminos,
        destinatario,
      });
      if (!validacionCampos.isValid) {
        return {
          statusCode: validacionCampos.error.statusCode,
          body: JSON.stringify({ error: validacionCampos.error.mensaje }),
        };
      }

      const emailHtmlPersonalizado = personalizarEmailHtml(emailHtml, {
        url,
        fechaVencimientos,
        urlTerminos,
      });

      const command = new SendEmailCommand({
        FromEmailAddress: process.env.FROM_EMAIL || "test@email.enersa.com.ar",
        Destination: {
          ToAddresses: [destinatario],
        },
        Content: {
          Simple: {
            Subject: { Data: process.env.EMAIL_SUBJECT || "Asunto del correo" },
            Body: {
              Html: { Data: emailHtmlPersonalizado },
            },
          },
        },
        ConfigurationSetName: process.env.CONFIGURATION_SET || "Enersa-SesConfigSet",
      });

      const response = await ses.send(command);

      const table = process.env.TABLENAME;
      const fecha = new Date();
      const formato = fecha.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const body = {
        S: JSON.stringify({
          estado: "pendiente",
          url: url,
          urlTerminos: urlTerminos,
          fechaVencimientos: fechaVencimientos,
          destinatario: destinatario,
          receivedAt: formato,
          contador: contador,
        }),
      };
      const input = {
        TableName: table,
        Item: {
          emailId: { S: response.MessageId },
          estado: { S: "pendiente" },
          body: body,
        },
      };

      const commandDynamoDB = new PutItemCommand(input);
      await ddbClient.send(commandDynamoDB);
      console.log("Correo enviado:", response.MessageId);
    }
    console.log("Cantidad de emails enviados", validacionCuerpo.datos.length);
    return {
      statusCode: 200,
      body: JSON.stringify({
        mensaje: "Correo enviado exitosamente",
      }),
    };
  } catch (error) {
    console.log("Error al enviar el correo:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error enviando el correo",
      }),
    };
  }
}
