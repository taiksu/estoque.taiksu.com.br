var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('balanco', { title: 'Iniciar balanço' });
});

router.get('/lista', function(req, res, next) {
    res.render('balanco/lista', { title: 'Lista de insumos' });
});

router.get('/revisar', function(req, res, next) {
    res.render('balanco/revisar', { title: 'Revisar balanço' });
});

module.exports = router;