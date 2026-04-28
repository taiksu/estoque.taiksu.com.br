var express = require('express');
var router = express.Router();
const { inventarioController } = require('../controllers');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Início' });
});

// Rotas de alertas
router.get('/alertas/ok', function (req, res, next) {
  res.render('alertas/ok', { title: 'Tudo em dia' });
});

router.get('/alertas/estoque', inventarioController.baixoEstoque, function (req, res, next) {
  res.render('alertas/baixo-estoque', { title: 'Baixo Estoque' });
});

module.exports = router;
