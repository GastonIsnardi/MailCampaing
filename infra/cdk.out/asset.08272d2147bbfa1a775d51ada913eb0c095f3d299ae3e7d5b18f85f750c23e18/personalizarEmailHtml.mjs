export const personalizarEmailHtml = (template, { url, fechaVencimientos, urlTerminos }) => {
  const emailPersonalizado = template;
  const reemplazos = {
    "&lt;var_url&gt;": `${url}/`,
    "&lt;var_fecha_vencimiento1&gt;": fechaVencimientos[0].fecha,
    "&lt;var_fecha_vencimiento2&gt;": fechaVencimientos[1].fecha,
    "&lt;var_url_terminos&gt;": urlTerminos,
    "&lt;var_nro_cuota1&gt;": fechaVencimientos[0].nroCuota,
    "&lt;var_nro_cuota2&gt;": fechaVencimientos[1].nroCuota,
  };

  return Object.entries(reemplazos).reduce(
    (html, [buscar, reemplazar]) => html.replace(new RegExp(buscar, "g"), reemplazar),
    emailPersonalizado
  );
};
