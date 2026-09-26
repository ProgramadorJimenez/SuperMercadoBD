function referencia(nombre) {
  return { $ref: `#/components/schemas/${nombre}` };
}

function respuestaExito(descripcion, esquema, esLista = false) {
  const propiedades = {
    ok: { type: 'boolean', example: true },
    mensaje: { type: 'string' }
  };

  if (esLista) {
    propiedades.total = { type: 'integer', example: 1 };
    propiedades.datos = { type: 'array', items: referencia(esquema) };
  } else {
    propiedades.datos = esquema ? referencia(esquema) : { type: 'object' };
  }

  return {
    description: descripcion,
    content: { 'application/json': { schema: { type: 'object', properties: propiedades } } }
  };
}

function respuestaError(descripcion, mensaje) {
  return {
    description: descripcion,
    content: {
      'application/json': {
        schema: referencia('Error'),
        example: { ok: false, mensaje }
      }
    }
  };
}

function cuerpo(esquema, ejemplo) {
  return {
    required: true,
    content: { 'application/json': { schema: referencia(esquema), example: ejemplo } }
  };
}

const parametroId = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'Identificador del registro',
  schema: { type: 'integer', minimum: 1 }
};

function filtro(nombre, descripcion, tipo = 'string') {
  return { name: nombre, in: 'query', required: false, description: descripcion, schema: { type: tipo } };
}

const errorValidacion = respuestaError('Datos inválidos', 'Los datos enviados no son válidos');
const errorIdInvalido = respuestaError('Id inválido', 'El id debe ser un número entero positivo');

module.exports = {
  referencia,
  respuestaExito,
  respuestaError,
  cuerpo,
  parametroId,
  filtro,
  errorValidacion,
  errorIdInvalido
};
