var express = require('express');
var router = express.Router();
const heartbeat = require('../client/heartbeat');
const checkEvent = require('../client/checkEvent');
const actions = require('../client/actions');


// Heartbeat - Online check status
router.get('/heartbeat', heartbeat);

// Recebe eventos do Broker
router.post('/receive', checkEvent, actions);

module.exports = router;

