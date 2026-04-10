// Recebe o event-type e executa a ação correspondente
// As actions seguem o padrão: evento recebido -> Controller responsável
const { entradaController, saidaController, loteController } = require('../controllers');

async function actions(req, res) {
    const eventType = req.headers['event-type'];

    // Movimentação de entrada - Legado
    if (eventType == 101) {
        entradaController.legado(req, res);
    }

    // Movimentação de saída - Legado
    if (eventType == 102) {
        saidaController.legado(req, res);
    }
    

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

    // Cancelamento de saída - Devolver ao estoque
    if (eventType == 95) {
        saidaController.desfazer(req, res);
    }

}

module.exports = actions;
