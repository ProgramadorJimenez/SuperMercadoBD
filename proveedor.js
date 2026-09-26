const { DataTypes } = require('sequelize');
const { limpiarTexto } = require('../utils/validaciones');

module.exports = (sequelize) => {
  const Proveedor = sequelize.define('Proveedor', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      set(valor) {
        this.setDataValue('name', limpiarTexto(valor));
      },
      validate: {
        notNull: { msg: 'El nombre del proveedor es obligatorio' },
        len: { args: [2, 100], msg: 'El nombre del proveedor debe tener entre 2 y 100 caracteres' }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      set(valor) {
        this.setDataValue('phone', limpiarTexto(valor));
      },
      validate: {
        notNull: { msg: 'El teléfono del proveedor es obligatorio' },
        is: {
          args: /^[0-9+\-\s()]{7,20}$/,
          msg: 'El teléfono debe tener entre 7 y 20 caracteres y solo puede contener números, espacios y los símbolos + - ( )'
        }
      }
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: { args: true, msg: 'Ya existe un proveedor registrado con ese correo' },
      set(valor) {
        this.setDataValue('email', typeof valor === 'string' ? valor.trim().toLowerCase() : valor);
      },
      validate: {
        notNull: { msg: 'El correo del proveedor es obligatorio' },
        isEmail: { msg: 'El correo del proveedor no tiene un formato válido' }
      }
    },
    city: {
      type: DataTypes.STRING(80),
      allowNull: false,
      set(valor) {
        this.setDataValue('city', limpiarTexto(valor));
      },
      validate: {
        notNull: { msg: 'La ciudad del proveedor es obligatoria' },
        len: { args: [2, 80], msg: 'La ciudad debe tener entre 2 y 80 caracteres' }
      }
    }
  }, {
    tableName: 'proveedores'
  });

  return Proveedor;
};
