import Joi from "joi";

const vencimientoSchema = Joi.object({
  fecha: Joi.string()
    .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": "La fecha debe tener el formato dd/mm/yyyy",
      "any.required": "La fecha de vencimiento es requerida",
    }),
  nroCuota: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/)).required().messages({
    "any.required": "El número de cuota es requerido",
    "string.pattern.base": "El número de cuota debe ser numérico",
  }),
});

const destinatarioSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    "string.uri": "La URL debe ser válida",
    "any.required": "La URL es requerida",
  }),
  urlTerminos: Joi.string().uri().required().messages({
    "string.uri": "La URL de términos debe ser válida",
    "any.required": "La URL de términos es requerida",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "El email debe tener un formato válido",
    "any.required": "El email es requerido",
  }),
  fechaVencimientos: Joi.array().items(vencimientoSchema).length(2).required().messages({
    "array.length": "Debe tener exactamente 2 fechas de vencimiento",
    "any.required": "Las fechas de vencimiento son requeridas",
  }),
});

const schema = Joi.object({
  destinatarios: Joi.array().items(destinatarioSchema).min(1).max(50).required().messages({
    "array.min": "Debe tener al menos 1 destinatario",
    "array.max": "No puede tener más de 50 destinatarios",
    "any.required": "Los destinatarios son requeridos",
  }),
});

export default schema;
