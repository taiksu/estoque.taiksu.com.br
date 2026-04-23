const { balancoController } = require('../controllers');
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('balanco', { title: 'Iniciar balanço' });
});

router.get('/lista', function(req, res, next) {
    res.render('balanco/lista', { title: 'Lista de insumos' });
});

router.get('/revisar', function(req, res, next) {
    res.render('balanco/revisar', { title: 'Revisar balanço' });
});

// Adiciona insumo na lista de balanço
router.post('/adicionar', balancoController.addInsumoBalanco);

// Descarta lista de balanço
router.delete('/descartar', balancoController.descartarListaBalanco);

// Lista itens da lista de balanço
router.get('/itens', balancoController.listaItensBalanco);

// Remove item da lista de balanço
router.delete('/remover', balancoController.removerItemBalanco);

// Processa balanço
router.put('/processar', balancoController.processar);

module.exports = router;