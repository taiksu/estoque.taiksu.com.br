var express = require('express');
var router = express.Router();

router.get('/', async (req, res) => {
    if (req.session.unidade_id != 8) {
        res.redirect('/');
    } else {
        res.render('comprar', { title: 'Comprar', layout: 'layoutloja' });
    }
});

router.get('/carrinho', async (req, res) => {
    res.render('comprar/carrinho', { title: 'Carrinho', layout: 'layoutloja'});
});

module.exports = router;