// Roles disponibles para los usuarios del supermercado
const ROLES = {
  administrador: 'Acceso total: gestiona usuarios, proveedores, productos y ventas',
  supervisor: 'Supervisa la operación de caja, puede registrar y corregir ventas',
  cajero: 'Registra las ventas en el punto de pago',
  bodeguero: 'Gestiona el inventario y la recepción de mercancía de los proveedores',
  auditor: 'Consulta ventas e inventario con fines de control, sin registrar operaciones'
};

const LISTA_ROLES = Object.keys(ROLES);

// Solo estos roles pueden aparecer como responsables de una venta
const ROLES_QUE_VENDEN = ['administrador', 'supervisor', 'cajero'];

const ROL_POR_DEFECTO = 'cajero';

module.exports = { ROLES, LISTA_ROLES, ROLES_QUE_VENDEN, ROL_POR_DEFECTO };
