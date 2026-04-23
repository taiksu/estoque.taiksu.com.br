const { LoteInsumo, sequelize } = require('../../models');
const { Op } = require('sequelize');

async function lotesValidos(unidadeId, insumoId) {
    console.log('[lotesValidos] unidadeId: ', unidadeId);
    const lotes = await LoteInsumo.findAll({
        where: {
            insumo_id: insumoId,
            unidade_id: unidadeId,
            quantidade: {
                [Op.gt]: 0
            }
        },
        order: [
            ['data_entrada', 'ASC']
        ]
    });
    return lotes;
};

module.exports = lotesValidos;
