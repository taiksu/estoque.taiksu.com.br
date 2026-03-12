// Recebe o event-type e executa a ação correspondente
// As actions seguem o padrão: evento recebido -> Controller responsável
const { entradaController, loteController } = require('../controllers');

async function actions(req, res) {
    const eventType = req.headers['event-type'];

    // Entrada cancelada - Remover lote restante
    if (eventType == 84) {
        loteController.desfazer(req, res);
    }

    // Limpeza de salmão - Entrada de lote
    if (eventType == 1) {
        entradaController.salmao(req, res);
    }

    // Cancelamento de limpeza de salmão - remover lote
    if (eventType == 2) {
        console.log('Cancelamento de limpeza de salmão - remover lote');
        loteController.excluirLimpeza(req, res);
    }

}

module.exports = actions;
