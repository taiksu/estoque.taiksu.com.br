const { LoteInsumo, Sequelize } = require('../../models');
const { Op } = Sequelize;

async function valorTotalEstoque(unidadeId) {
    // 🔹 1. Agrupa e soma os lotes por insumo
    const lotesAgrupados = await LoteInsumo.findAll({
        attributes: [
            'insumo_id',
            [Sequelize.fn('SUM', Sequelize.col('quantidade')), 'quantidade_total'],
            [Sequelize.fn('SUM', Sequelize.col('valor_total')), 'valor_total_soma']
        ],
        where: {
            unidade_id: unidadeId
        },
        group: ['insumo_id'],
        raw: true
    });

    console.log('lotesAgrupados:', lotesAgrupados);

    // Valor total no estoque
    const valor_total_estoque = lotesAgrupados.reduce((acc, lote) => {
        return acc + Number(lote.valor_total_soma);
    }, 0);

    return { valor_total_estoque, lotesAgrupados };
}

module.exports = valorTotalEstoque;