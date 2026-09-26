const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DetalleVenta = sequelize.define('DetalleVenta', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    saleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'La venta (saleId) es obligatoria' }
      }
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'El producto (productId) es obligatorio' }
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'La cantidad es obligatoria' },
        isInt: { msg: 'La cantidad debe ser un número entero' },
        min: { args: [1], msg: 'La cantidad debe ser al menos 1' }
      }
    },
    // Precio unitario del producto en el momento de la venta
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const valor = this.getDataValue('price');
        return valor === null || valor === undefined ? valor : Number(valor);
      },
      validate: {
        min: { args: [0.01], msg: 'El precio del detalle debe ser mayor a 0' }
      }
    }
  }, {
    tableName: 'detalle_ventas',
    indexes: [
      { unique: true, fields: ['saleId', 'productId'] }
    ]
  });

  return DetalleVenta;
};
