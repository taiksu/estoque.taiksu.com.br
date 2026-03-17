var express = require('express');
var router = express.Router();

router.get('/', async (req, res) => {
    res.render('pedidos', { title: 'Pedidos', layout: 'layoutloja' });
});

router.get('/:id', async (req, res) => {
    res.render('pedidos/show', { title: 'Pedido', pedidoId: req.params.id, layout: 'layoutloja' });
});

module.exports = router;