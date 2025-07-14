import * as fs from "fs/promises";
import * as path from "path";

const dirPath = path.join(__dirname, "mail");

export const listarArchivos = async () => {
  try {
    const archivos = await fs.readdir(dirPath);
    console.log("Archivos en el directorio:", archivos);
  } catch (err) {
    console.error("Error al leer el directorio:", err);
  }
};
