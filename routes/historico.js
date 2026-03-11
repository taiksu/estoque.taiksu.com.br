var express = require('express');
var router = express.Router();

router.get('/',  async (req, res) => {
    res.render('historico', { title: 'Histórico' });
});

router.get('/entradas',  async (req, res) => {
    res.render('historico/entradas', { title: 'Entradas' });
});

router.get('/saidas',  async (req, res) => {
    res.render('historico/saidas', { title: 'Saídas' });
});

module.exports = router;
