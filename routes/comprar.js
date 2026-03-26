var express = require('express');
var router = express.Router();
const publishEvent = require('../client/publishEvent');

router.get('/', async (req, res) => {
    res.render('comprar', { title: 'Comprar', layout: 'layoutloja' });
});

router.get('/carrinho', async (req, res) => {
    res.render('comprar/carrinho', { title: 'Carrinho', layout: 'layoutloja'});
});

router.get('/fornecedor/:id', async (req, res) => {
    const { id } = req.params;

    // Publica evento
    publishEvent({
        eventId: 98,
        payload: {
            fornecedor_id: id,
            user_id: req.session.id_user,
            unidade_id: req.session.unidade_id
        },
        userId: req.session.id_user,
        priority: 'low'
    })

    res.render('comprar/fornecedor', { title: 'Fornecedor', layout: 'layoutloja', fornecedorId: id});
});

router.get('/termos', async (req, res) => {
    res.render('comprar/termos', { title: 'Termos e Condições', layout: 'layoutloja'});
});

module.exports = router;