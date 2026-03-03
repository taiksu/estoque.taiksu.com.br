var express = require('express');
var router = express.Router();
var { inventarioController } = require('../controllers');

router.get('/:id', inventarioController.show, async (req, res) => {
    res.render('inventario', { title: 'Insumo' });
});

module.exports = router;
