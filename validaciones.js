function esEnteroPositivo(valor) {
  if (typeof valor !== 'number' && typeof valor !== 'string') return false;
  if (typeof valor === 'string' && valor.trim() === '') return false;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0;
}

function redondear(valor) {
  return Math.round(Number(valor) * 100) / 100;
}

function limpiarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : valor;
}

// Toma del body solo los campos permitidos para evitar que se modifiquen
// columnas como id, createdAt o total desde la petición
function extraerCampos(cuerpo, camposPermitidos) {
  const datos = {};

  if (!cuerpo || typeof cuerpo !== 'object') {
    return datos;
  }

  camposPermitidos.forEach((campo) => {
    if (cuerpo[campo] !== undefined) {
      datos[campo] = cuerpo[campo];
    }
  });

  return datos;
}

module.exports = { esEnteroPositivo, redondear, limpiarTexto, extraerCampos };
