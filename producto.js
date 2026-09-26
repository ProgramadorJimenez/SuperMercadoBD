const { DataTypes } = require('sequelize');
const { limpiarTexto } = require('../utils/validaciones');

module.exports = (sequelize) => {
  const Producto = sequelize.define('Producto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      set(valor) {
        this.setDataValue('name', limpiarTexto(valor));
      },
      validate: {
        notNull: { msg: 'El nombre del producto es obligatorio' },
        len: { args: [2, 120], msg: 'El nombre del producto debe tener entre 2 y 120 caracteres' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      set(valor) {
        this.setDataValue('description', limpiarTexto(valor) || null);
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const valor = this.getDataValue('price');
        return valor === null || valor === undefined ? valor : Number(valor);
      },
      validate: {
        notNull: { msg: 'El precio del producto es obligatorio' },
        esPrecioValido(valor) {
          if (typeof valor === 'boolean' || valor === '' || Number.isNaN(Number(valor))) {
            throw new Error('El precio debe ser un valor numérico');
          }
          if (Number(valor) <= 0) {
            throw new Error('El precio debe ser mayor a 0');
          }
        }
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        notNull: { msg: 'El stock del producto es obligatorio' },
        isInt: { msg: 'El stock debe ser un número entero' },
        min: { args: [0], msg: 'El stock no puede ser negativo' }
      }
    },
    providerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'El proveedor del producto (providerId) es obligatorio' },
        isInt: { msg: 'El providerId debe ser un número entero' }
      }
    }
  }, {
    tableName: 'productos'
  });

  return Producto;
};
