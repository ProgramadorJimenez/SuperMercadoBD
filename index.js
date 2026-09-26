const { Router } = require('express');

const router = Router();

router.use('/proveedores', require('./proveedores'));
router.use('/productos', require('./productos'));
router.use('/usuarios', require('./usuarios'));
router.use('/ventas', require('./ventas'));
router.use('/detalle-ventas', require('./detalleVentas'));

module.exports = router;
