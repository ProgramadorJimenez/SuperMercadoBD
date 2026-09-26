const { DataTypes } = require('sequelize');
const { LISTA_ROLES, ROL_POR_DEFECTO } = require('../config/roles');
const { limpiarTexto } = require('../utils/validaciones');

module.exports = (sequelize) => {
  const Usuario = sequelize.define('Usuario', {
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
        notNull: { msg: 'El nombre del usuario es obligatorio' },
        len: { args: [3, 100], msg: 'El nombre del usuario debe tener entre 3 y 100 caracteres' }
      }
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: { args: true, msg: 'El correo ya está registrado por otro usuario' },
      set(valor) {
        this.setDataValue('email', typeof valor === 'string' ? valor.trim().toLowerCase() : valor);
      },
      validate: {
        notNull: { msg: 'El correo del usuario es obligatorio' },
        isEmail: { msg: 'El correo del usuario no tiene un formato válido' }
      }
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: ROL_POR_DEFECTO,
      set(valor) {
        this.setDataValue('role', typeof valor === 'string' ? valor.trim().toLowerCase() : valor);
      },
      validate: {
        notNull: { msg: 'El rol del usuario es obligatorio' },
        isIn: {
          args: [LISTA_ROLES],
          msg: `El rol no es válido. Roles permitidos: ${LISTA_ROLES.join(', ')}`
        }
      }
    }
  }, {
    tableName: 'usuarios'
  });

  return Usuario;
};
