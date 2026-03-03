var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Início' });
});

// Rotas de alertas
router.get('/alertas/ok', function (req, res, next) {
  res.render('alertas/ok', { title: 'Tudo em dia' });
});

module.exports = router;
