var express = require('express');
var router = express.Router();

router.get('/desfazer/entrada/:id', async (req, res) => {
    res.render('processo/entrada-rollback', { title: 'Desfazer Entrada', entradaId: req.params.id });
});

router.get('/excluir/lote/:id', async (req, res) => {
    res.render('processo/lote-delete', { title: 'Excluir lote', loteId: req.params.id });
});

module.exports = router;
