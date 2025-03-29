const groupBy = (array, key, parseJsonKeys = []) => {
  return array.reduce((acc, item) => {
    // Si hay claves en parseJsonKeys, parsearlas a JSON
    parseJsonKeys.forEach((jsonKey) => {
      if (item[jsonKey] && typeof item[jsonKey] === "string") {
        try {
          item[jsonKey] = JSON.parse(item[jsonKey]);
        } catch (e) {
          console.warn(`Error al parsear JSON en ${jsonKey}:`, e);
        }
      }
    });

    // Obtener el valor de la clave dinámica
    const groupKey = key.split(".").reduce((obj, prop) => obj?.[prop], item);

    if (!groupKey) return acc; // Si la clave es undefined o null, ignorar

    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }

    acc[groupKey].push(item);
    return acc;
  }, {});
};

export default groupBy;
