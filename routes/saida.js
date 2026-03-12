var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('saida/index', { title: 'Saída' });
});

router.get('/revisar', function(req, res, next) {
    res.render('saida/revisar', { title: 'Revisar saída' });
});

module.exports = router;