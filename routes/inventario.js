var express = require('express');
var router = express.Router();
var { loteController } = require('../controllers');

router.get('/:id', loteController.show, async (req, res) => {
    res.render('inventario', { title: 'Insumo' });
});

module.exports = router;
