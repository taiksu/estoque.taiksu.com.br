var express = require('express');
var router = express.Router();

// Define Layout do tablet
router.use((req, res, next) => {
    res.locals.layout = 'layouts/tablet';
    next();
});

// Página de saída principal
router.get('/', function (req, res, next) {
  res.render('tablet/index', { title: 'Saída de Produtos' });
});

// Página de autenticação
router.get('/login', function (req, res, next) {
  res.render('tablet/login', { title: 'Acessar Estoque' });
});

router.post('/login', function (req, res, next) {

  // Adicionar autenticação de verdade depois :)
    const { pin } = req.body;
    if (pin === '1234') {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});


module.exports = router;
