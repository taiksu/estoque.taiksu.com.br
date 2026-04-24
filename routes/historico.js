const { balancoController } = require('../controllers');
var express = require('express');
var router = express.Router();

router.get('/', async (req, res) => {
    res.render('historico', { title: 'Histórico' });
});

router.get('/entradas', async (req, res) => {
    res.render('historico/entradas', { title: 'Entradas' });
});

router.get('/saidas', async (req, res) => {
    res.render('historico/saidas', { title: 'Saídas' });
});

router.get('/balancos', balancoController.historico, (req, res) => {
    res.render('historico/balancos', { title: 'Balanços' });
});

router.get('/balancos/:id', balancoController.detalhesBalanco, (req, res) => {
    res.render('historico/infobalanco', { title: 'Detalhes do Balanço' });
});

module.exports = router;
