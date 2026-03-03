var express = require('express');
var router = express.Router();
const heartbeat = require('../client/heartbeat');


// Heartbeat - Online check status
router.get('/heartbeat', heartbeat);

module.exports = router;