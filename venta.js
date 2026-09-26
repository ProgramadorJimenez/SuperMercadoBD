const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Venta = sequelize.define('Venta', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'El usuario que registra la venta (userId) es obligatorio' }
      }
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      validate: {
        isDate: { args: true, msg: 'La fecha de la venta no es válida' },
        noEsFutura(valor) {
          // Se da un margen de 5 minutos por diferencias de reloj entre equipos
          if (new Date(valor).getTime() > Date.now() + 5 * 60 * 1000) {
            throw new Error('La fecha de la venta no puede ser posterior a la fecha actual');
          }
        }
      }
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const valor = this.getDataValue('total');
        return valor === null || valor === undefined ? valor : Number(valor);
      },
      validate: {
        min: { args: [0], msg: 'El total de la venta no puede ser negativo' }
      }
    }
  }, {
    tableName: 'ventas'
  });

  return Venta;
};
