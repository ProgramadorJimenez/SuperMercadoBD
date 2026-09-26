class ErrorApi extends Error {
  constructor(mensaje, estado = 400, errores = null) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
    this.errores = errores;
  }
}

module.exports = ErrorApi;
