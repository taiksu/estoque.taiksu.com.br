var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('balanco', { title: 'Balanço' });
});

router.get('/revisar', function(req, res, next) {
    res.render('balanco/revisar', { title: 'Revisar balanço' });
});

module.exports = router;