var express = require('express');
var router = express.Router();

router.get('/', async (req, res) => {
    res.render('comprar', { title: 'Comprar' });
});

router.get('/carrinho', async (req, res) => {
    res.render('comprar/carrinho', { title: 'Carrinho' });
});

module.exports = router;