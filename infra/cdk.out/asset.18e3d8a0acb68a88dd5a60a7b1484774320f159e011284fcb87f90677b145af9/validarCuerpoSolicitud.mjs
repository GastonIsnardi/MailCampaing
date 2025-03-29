// Funciones auxiliares
export const validarCuerpoSolicitud = (event) => {
  const Records = event.Records;
  if (!event.Records[0].body) {
    throw new Error("Cuerpo de la solicitud vacío");
  }

  const parsedBodys = [];
  try {
    for (const record of Records) {
      parsedBodys.push(JSON.parse(record.body));
    }
  } catch (error) {
    console.log(error);
    throw new Error("Formato JSON inválido");
  }

  return { isValid: true, datos: parsedBodys };
};
