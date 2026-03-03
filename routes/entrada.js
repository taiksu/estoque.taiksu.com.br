var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('entrada/index', { title: 'Entrada' });
});

router.get('/manual', function(req, res, next) {
    res.render('entrada/manual', { title: 'Entrada manual' });
});

router.get('/manual/revisar', function(req, res, next) {
    res.render('entrada/manual/revisar', { title: 'Revisar entrada' });
});

module.exports = router;