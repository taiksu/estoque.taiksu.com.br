var express = require('express');
var router = express.Router();
const publishEvent = require('../client/publishEvent');

// Define Layout da loja virtual
router.use((req, res, next) => {
    res.locals.layout = 'layouts/loja';
    next();
});

router.get('/', async (req, res) => {
    res.render('comprar', { title: 'Encontre todos os insumos que sua unidade precisa', search: true });
});

router.get('/carrinho', async (req, res) => {
    res.render('comprar/carrinho', { title: 'Carrinho'});
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

    res.render('comprar/fornecedor', { title: 'Fornecedor', fornecedorId: id});
});

router.get('/termos', async (req, res) => {
    res.render('comprar/termos', { title: 'Termos e Condições'});
});

router.get('/favoritos', async (req, res) => {
    res.render('comprar/favoritos', { title: 'Favoritos'});
});

router.get('/pedidos', async (req, res) => {
    res.render('comprar/pedidos', { title: 'Pedidos' });
});

router.get('/pedidos/:id', async (req, res) => {
    res.render('comprar/pedidos/show', { title: 'Pedido', pedidoId: req.params.id });
});

module.exports = router;