const { InsumoSaida, ListaSaida } = require('../../models');

async function itensSaida(unidadeId) {
        // Busca a lista de saída pendente para a unidade
        const lista_saida = await ListaSaida.findOne({
            where: {
                unidade_id: unidadeId,
                status: 'pendente'
            }
        });

        // Busca os itens da lista de saída
        let itens_saida = await InsumoSaida.findAll({
            where: {
                lista_saida_id: lista_saida.id
            }
        });

        return { itens_saida, lista_saida };
}

module.exports = itensSaida;