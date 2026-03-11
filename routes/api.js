var express = require('express');
var router = express.Router();
var { inventarioController, listaEntradaController, entradaController, loteController } = require('../controllers');


// Inventário
router.get('/inventario/:id', inventarioController.listarLotes);
router.post('/inventario/lista-minima', inventarioController.listarQuantidadesMinimas); 
router.post('/inventario/atualizar-minima', inventarioController.atualizarMinima);


// Lista de entrada
router.get('/lista-entrada', listaEntradaController.index);
router.post('/lista-entrada/add', listaEntradaController.add);
router.delete('/lista-entrada/delete', listaEntradaController.delete);
router.put('/lista-entrada/editar', listaEntradaController.editar);
router.post('/entrada/manual', entradaController.manual);

// Lote
router.delete('/excluir/lote', loteController.excluir);

module.exports = router;
