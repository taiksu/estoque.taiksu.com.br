var express = require('express');
var router = express.Router();

router.get('/', async (req, res) => {
    res.render('pedidos', { title: 'Pedidos' });
});

router.get('/:id', async (req, res) => {
    res.render('pedidos/show', { title: 'Pedido', pedidoId: req.params.id });
});

module.exports = router;