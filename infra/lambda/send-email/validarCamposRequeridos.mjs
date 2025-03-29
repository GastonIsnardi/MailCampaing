export const validarCamposRequeridos = ({ url, fechaVencimientos, urlTerminos, destinatario }) => {
  console.log("url", url);
  console.log("fechaVencimientos", fechaVencimientos);
  console.log("urlTerminos", urlTerminos);
  console.log("destinatario", destinatario);
  if (!url || !fechaVencimientos || !urlTerminos || !destinatario) {
    throw new Error("Faltan campos requeridos (url, fechaVencimientos o urlTerminos)");
  }

  if (!Array.isArray(fechaVencimientos) || fechaVencimientos.length < 2) {
    throw new Error("fechaVencimientos debe ser un array con al menos 2 elementos");
  }

  return { isValid: true };
};
