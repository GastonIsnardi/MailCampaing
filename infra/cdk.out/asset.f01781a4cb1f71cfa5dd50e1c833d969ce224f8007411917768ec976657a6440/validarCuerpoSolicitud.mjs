// Funciones auxiliares
export const validarCuerpoSolicitud = (event) => {
  const body = event.Records[0].body;
  if (!body) {
    throw new Error("Cuerpo de la solicitud vacío");
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch (error) {
    console.log(error);
    throw new Error("Formato JSON inválido");
  }

  return { isValid: true, datos: parsedBody };
};
