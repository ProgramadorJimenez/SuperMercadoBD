const { Router } = require('express');
const controlador = require('../controllers/ventaController');
const validarId = require('../middlewares/validarId');

const router = Router();

router.get('/', controlador.listar);
router.get('/:id', validarId, controlador.obtenerPorId);
router.post('/', controlador.crear);
router.put('/:id', validarId, controlador.actualizar);
router.delete('/:id', validarId, controlador.eliminar);

module.exports = router;
