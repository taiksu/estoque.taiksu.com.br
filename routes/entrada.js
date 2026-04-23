var express = require('express');
const { entradaPedidoController } = require('../controllers');
var router = express.Router();

router.get('/', entradaPedidoController.index, function (req, res, next) {
    res.render('entrada/index', { title: 'Entrada' });
});

router.get('/manual', function (req, res, next) {
    res.render('entrada/manual', { title: 'Entrada manual' });
});

router.get('/pedido/:id', entradaPedidoController.index, function (req, res, next) {
    res.render('entrada/pedido', { title: 'Revisar entrada', pedidoId: req.params.id });
});

router.get('/manual/revisar', function(req, res, next) {
    res.render('entrada/manual/revisar', { title: 'Revisar entrada' });
});

module.exports = router;