import path from "path";
import { dirname } from "path";
import fs from "fs";
import { logger } from "/opt/db/utils/powertools";

export const personalizarEmailHtml = ({
  url,
  fechaVencimientos,
  urlTerminos,
}: {
  url: string;
  fechaVencimientos: { fecha: string; nroCuota: string }[];
  urlTerminos: string;
}) => {
  logger.info("Personalizando email HTML", { url, fechaVencimientos, urlTerminos });
  // Obtener la ruta del archivo actual (compatible con CommonJS)
  const currentDir = dirname(require.main?.filename || "");
  logger.info("Current directory", { currentDir });

  // Ruta al archivo HTML dentro de la carpeta "mail"
  const htmlPath = path.join(__dirname, "mail", "estimado_cliente.html");

  // Leer el archivo HTML
  let emailHtml = fs.readFileSync(htmlPath, "utf8");

  // URL del bucket S3 donde están alojadas las imágenes
  const bucketUrl = `${process.env.S3URL}/` || "test.test";

  // Reemplazar las URLs de imágenes en el HTML con la del bucket S3
  emailHtml = emailHtml.replace(/&lt;url_assets&gt;/g, bucketUrl);
  if (!url || !fechaVencimientos || !urlTerminos) {
    throw new Error("Faltan datos para personalizar el email");
  }
  const emailPersonalizado = emailHtml;
  logger.info("Fecha vencimientos", { fechaVencimientos });
  const reemplazos = {
    "&lt;var_url&gt;": `${url}`,
    "&lt;var_fecha_vencimiento1&gt;": fechaVencimientos[0].fecha,
    "&lt;var_fecha_vencimiento2&gt;": fechaVencimientos[1].fecha,
    "&lt;var_url_terminos&gt;": urlTerminos,
    "&lt;var_nro_cuota1&gt;": fechaVencimientos[0].nroCuota,
    "&lt;var_nro_cuota2&gt;": fechaVencimientos[1].nroCuota,
  };
  logger.info("Reemplazos", { reemplazos });
  return Object.entries(reemplazos).reduce(
    (html, [buscar, reemplazar]) => html.replace(new RegExp(buscar, "g"), reemplazar),
    emailPersonalizado
  );
};
