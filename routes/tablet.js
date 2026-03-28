var express = require('express');
var router = express.Router();

// Define Layout do tablet
router.use((req, res, next) => {
    res.locals.layout = 'layouts/tablet';
    next();
});

// Página de autenticação
router.get('/login', function (req, res, next) {
  res.render('tablet/login', { title: 'Acessar Estoque' });
});


module.exports = router;
