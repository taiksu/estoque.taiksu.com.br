require('dotenv').config();

const EVENT_BROKER_BASE_URL = process.env.EVENT_BROKER_BASE_URL || 'http://127.0.0.1:3093';
const EVENT_BROKER_PUBLISH_PATH = process.env.EVENT_BROKER_PUBLISH_PATH || '/api/event';
const EVENT_BROKER_SERVICE_TOKEN = process.env.EVENT_BROKER_SERVICE_TOKEN || '';

async function publishEvent({ eventId, payload, userId, priority }) {
    // Implementar try-cath para tratar erros de conexão com o Event Broker
    try {
        const response = await fetch(`${EVENT_BROKER_BASE_URL}${EVENT_BROKER_PUBLISH_PATH}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'service-token': EVENT_BROKER_SERVICE_TOKEN,
                'user': userId,
                'event': eventId,
                'priority': priority,
            },
            body: JSON.stringify(payload),
        });

        // Lança erro se a requisição falhar
        if (!response.ok) {
            throw new Error(`[publishEvent] Event broker respondeu com status ${response.status}`);
        }

    } catch (error) {
        console.error('[publishEvent] Error publishing event: ', error);
        throw error;
    }
};

module.exports = publishEvent;
