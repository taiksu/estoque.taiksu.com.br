// Valida se o evento já foi processado antes

// Recebe o ID da entrega e o tipo de evento
// Verifica se o evento já foi processado
// Em caso negativo, registra a entrega na tabela local com status false
// Passa para o próximo middleware

// Se o evento já foi processado, retorna erro

const { EventosProcessados } = require('../models');
const marcaProcessando = require('./marcaProcessando');
const serviceToken = process.env.SERVICE_TOKEN;

async function checkEvent(req, res, next) {
    console.log('Verificando se o evento já foi processado');
    let event = null;
    const deliveryId = req.headers['delivery-id'];
    const eventType = req.headers['event-type'];

    if(!deliveryId || !eventType){
        console.log('Header delivery-id ou event-type não informado');
        return res.status(400).json({status: 'error', message: 'Header delivery-id ou event-type não informado'});
    }

    event = await EventosProcessados.findOne({
        where: {
            delivery_id: deliveryId,
        }
    });

    if (!event) {
        // Evento novo recebido
        console.log('Evento novo recebido');
        await EventosProcessados.create({
            delivery_id: deliveryId,
            event_type: eventType,
            status: false
        });
        return next();
    }

    // Evento já processado
    if (event.status == true) {
        const response = await fetch('http://127.0.0.1:3093/api/delivery/ok', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'service-token': serviceToken
            },
            body: JSON.stringify({
                delivery_id: deliveryId
            })
        });
        const data = await response.json()
        console.log('Evento já processado', data);
        return res.status(409).json({status: 'error', message: 'Evento já processado'});
        
    } else if (event.status == false) {
        // Evento em processamento - marcar como processando
        console.log('Evento em processamento');
        await marcaProcessando(deliveryId);
        return res.status(409).json({status: 'error', message: 'Evento em processamento'});
    }

    next();
}
module.exports = checkEvent;
