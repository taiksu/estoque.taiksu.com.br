// Esta função auxiliar limpa lotes com quantidade 0, ou seja os que já foram totalmente utilizados
const { Op } = require('sequelize');
const { LoteInsumo } = require('../models');

async function limpaLoteAntigo() {
    const lotesAntigos = await LoteInsumo.findAll({
        where: {
            quantidade: {
                [Op.eq]: 0
            },
            updatedAt: {
                [Op.lt]: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // Mais antigos que 3 dias
            }
        }
    });

    lotesAntigos.forEach(lote => {
        lote.destroy({
            force: true //Ignora paranoid e remove do banco de dados (HARD DELETE)
        });
    });
    const quantidadeLotes = lotesAntigos.length;
    console.log('[LimpaLoteAntigo]', quantidadeLotes, 'Lotes antigos removidos com sucesso!')
};
module.exports = limpaLoteAntigo;