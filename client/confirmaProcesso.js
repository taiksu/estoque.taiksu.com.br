const { EventosProcessados } = require('../models');
const serviceToken = process.env.SERVICE_TOKEN;

async function confirmaProcesso(deliveryId) {
    
    try {
        await fetch('http://127.0.0.1:3093/api/delivery/ok', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'service-token': serviceToken
            },
            body: JSON.stringify({
                delivery_id: deliveryId
            })
        });

        await EventosProcessados.update({
            status: true
        }, {
            where: {
                delivery_id: deliveryId
            }
        });

        console.log('Evento processado com sucesso!');
    } catch (error) {
        console.error(error);
        console.log('Erro confirmar processamento!');
    }
}

module.exports = confirmaProcesso;
