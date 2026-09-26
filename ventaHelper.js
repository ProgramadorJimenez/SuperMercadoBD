const { Producto, Usuario, Venta, DetalleVenta } = require('../models');
const ErrorApi = require('../utils/ErrorApi');
const { esEnteroPositivo, redondear } = require('../utils/validaciones');
const { ROLES_QUE_VENDEN } = require('../config/roles');

// Relaciones que se incluyen al consultar una venta completa
const INCLUIR_VENTA = [
  { model: Usuario, as: 'usuario', attributes: ['id', 'name', 'email', 'role'] },
  {
    model: DetalleVenta,
    as: 'detalles',
    attributes: ['id', 'productId', 'quantity', 'price'],
    include: [{ model: Producto, as: 'producto', attributes: ['id', 'name'] }]
  }
];

async function validarVendedor(userId, transaction) {
  if (!esEnteroPositivo(userId)) {
    throw new ErrorApi('El userId es obligatorio y debe ser un número entero positivo', 400);
  }

  const usuario = await Usuario.findByPk(userId, { transaction });

  if (!usuario) {
    throw new ErrorApi(`No existe un usuario con id ${userId}`, 404);
  }

  if (!ROLES_QUE_VENDEN.includes(usuario.role)) {
    throw new ErrorApi(
      `El usuario "${usuario.name}" tiene el rol "${usuario.role}" y no puede registrar ventas. ` +
      `Roles autorizados: ${ROLES_QUE_VENDEN.join(', ')}`,
      403
    );
  }

  return usuario;
}

// Valida la lista de productos de la venta y agrupa los que vengan repetidos
function normalizarDetalles(detalles) {
  if (!Array.isArray(detalles) || detalles.length === 0) {
    throw new ErrorApi('La venta debe incluir al menos un producto en el campo "detalles"', 400);
  }

  const agrupados = new Map();

  detalles.forEach((detalle, posicion) => {
    if (!detalle || typeof detalle !== 'object') {
      throw new ErrorApi(`El elemento ${posicion + 1} de "detalles" no es válido`, 400);
    }

    if (!esEnteroPositivo(detalle.productId)) {
      throw new ErrorApi(`El productId del elemento ${posicion + 1} debe ser un número entero positivo`, 400);
    }

    if (!esEnteroPositivo(detalle.quantity)) {
      throw new ErrorApi(`La cantidad (quantity) del elemento ${posicion + 1} debe ser un número entero mayor a 0`, 400);
    }

    const productId = Number(detalle.productId);
    agrupados.set(productId, (agrupados.get(productId) || 0) + Number(detalle.quantity));
  });

  return Array.from(agrupados, ([productId, quantity]) => ({ productId, quantity }));
}

// Bloquea los productos, revisa el stock, crea los detalles y descuenta el inventario
async function registrarDetalles(saleId, items, transaction) {
  const ids = items.map((item) => item.productId);

  const productos = await Producto.findAll({
    where: { id: ids },
    order: [['id', 'ASC']],
    lock: transaction.LOCK.UPDATE,
    transaction
  });

  const productosPorId = new Map(productos.map((producto) => [producto.id, producto]));
  const inexistentes = ids.filter((id) => !productosPorId.has(id));

  if (inexistentes.length > 0) {
    throw new ErrorApi(`No existen productos con id: ${inexistentes.join(', ')}`, 404);
  }

  const sinStock = items
    .filter((item) => productosPorId.get(item.productId).stock < item.quantity)
    .map((item) => {
      const producto = productosPorId.get(item.productId);
      return {
        productId: producto.id,
        producto: producto.name,
        disponible: producto.stock,
        solicitado: item.quantity
      };
    });

  if (sinStock.length > 0) {
    throw new ErrorApi('Stock insuficiente para uno o más productos', 409, sinStock);
  }

  for (const item of items) {
    const producto = productosPorId.get(item.productId);

    await DetalleVenta.create({
      saleId,
      productId: producto.id,
      quantity: item.quantity,
      price: producto.price
    }, { transaction });

    await producto.decrement('stock', { by: item.quantity, transaction });
  }
}

// Regresa al inventario las unidades de todos los detalles de una venta
async function devolverStock(saleId, transaction) {
  const detalles = await DetalleVenta.findAll({ where: { saleId }, transaction });

  for (const detalle of detalles) {
    await Producto.increment('stock', {
      by: detalle.quantity,
      where: { id: detalle.productId },
      transaction
    });
  }
}

async function recalcularTotal(saleId, transaction) {
  const detalles = await DetalleVenta.findAll({ where: { saleId }, transaction });
  const total = redondear(detalles.reduce((suma, detalle) => suma + detalle.price * detalle.quantity, 0));

  await Venta.update({ total }, { where: { id: saleId }, transaction });
  return total;
}

module.exports = {
  INCLUIR_VENTA,
  validarVendedor,
  normalizarDetalles,
  registrarDetalles,
  devolverStock,
  recalcularTotal
};
