const { LoteInsumo, sequelize } = require('../../models');
const { Op } = require('sequelize');

async function atualizaInsumosEntrada(insumos_entrada, unidadeId) {

    for (const insumo of insumos_entrada) {
        console.log('[atualizaInsumosEntrada] Substituindo quantidade por', insumo.quantidade_atualizada, 'no insumo', insumo.insumo_id);

        // Busca todos os lotes válidos por ordem de entrada
        const lotesValidos = await LoteInsumo.findAll({
            where: {
                insumo_id: insumo.insumo_id,
                unidade_id: unidadeId,
                quantidade: {
                    [Op.gt]: 0
                }
            },
            order: [
                ['data_entrada', 'ASC']
            ]
        });

        const quantiadadeTotalLotes = lotesValidos.reduce((acc, lote) => acc + Number(lote.quantidade), 0);

        // Calcula diferença entre quantidade atualizada e quantidade do lote
        const diferenca = Number(insumo.quantidade_atualizada) - Number(quantiadadeTotalLotes);

        // Atualiza quantidade do lote mais recente somando a quantidade atual com a diferença
        if (lotesValidos.length > 0) {
            await LoteInsumo.update({
                quantidade: Number(lotesValidos[0].quantidade) + Number(diferenca),
                valor_total: (Number(lotesValidos[0].quantidade) + Number(insumo.quantidade_atualizada)) * Number(lotesValidos[0].valor_unitario)
            }, {
                where: {
                    id: lotesValidos[0].id,
                }
            });

            const loteAtualizado = await LoteInsumo.findOne({
                where: {
                    id: lotesValidos[0].id,
                }
            });


            console.log('[LoteAtualizado Entrada]: ', loteAtualizado);
        }
        
    
    }
};

module.exports = atualizaInsumosEntrada;