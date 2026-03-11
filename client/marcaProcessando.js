const { EventosProcessados } = require('../models');
const serviceToken = process.env.SERVICE_TOKEN;

async function marcaProcessando(deliveryId) {
    try {
        await fetch('http://127.0.0.1:3093/api/delivery/processando', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'service-token': serviceToken
            },
            body: JSON.stringify({
                delivery_id: deliveryId
            })
        });

        console.log('Evento marcado como processando!');
    } catch (error) {
        console.error(error);
        console.log('Erro ao marcar evento como processando!');
    }
}

module.exports = marcaProcessando;
