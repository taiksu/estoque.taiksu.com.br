var express = require('express');
var router = express.Router();
var { inventarioController, listaEntradaController, listaSaidaController, entradaController, loteController, saidaController } = require('../controllers');
const validarQuantidadeRetirada = require('../middlewares/validarQuantidadeRetirada');


// Inventário
router.get('/inventario/:id', inventarioController.listarLotes);
router.post('/inventario/lista-minima', inventarioController.listarQuantidadesMinimas); 
router.post('/inventario/atualizar-minima', inventarioController.atualizarMinima);
router.get('/inventario/item/:unidade/:id', loteController.emEstoque);


// Lista de entrada
router.get('/lista-entrada', listaEntradaController.index);
router.post('/lista-entrada/add', listaEntradaController.add);
router.delete('/lista-entrada/delete', listaEntradaController.delete);
router.put('/lista-entrada/editar', listaEntradaController.editar);
router.post('/entrada/manual', entradaController.manual);

// Saída
router.get('/lista-saida', listaSaidaController.index);
router.put('/saida/manual', saidaController.saidaManual);
router.put('/lista-saida/add', listaSaidaController.add);

// Lote
router.delete('/excluir/lote', loteController.excluir);

module.exports = router;
