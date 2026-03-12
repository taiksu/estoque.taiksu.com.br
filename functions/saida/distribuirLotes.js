// Esta função recebe a quantidade total de saída e distribui entre os lotes de forma FIFO
// RETORNO: Array de lotes e quantidade a ser retirada de cada um
const { LoteInsumo } = require('../../models')
const { Op } = require('sequelize');

async function distribuirLotes(itens, lista_saida) {

    const resultado = [];

    for (const item of itens) {

        let quantidadeRestante = Number(item.quantidade);

        const lotes = await LoteInsumo.findAll({
            where: {
                insumo_id: item.id,
                unidade_id: lista_saida.unidade_id,
                quantidade: {
                    [Op.gt]: 0
                }
            },
            order: [
                ['data_entrada', 'ASC'] // Ordena os lotes por data de entrada em ordem crescente
            ]
        });

        const retiradas = [];

        for (const lote of lotes) {

            if (quantidadeRestante <= 0) break;

            const disponivel = Number(lote.quantidade);

            const retirada = Math.min(disponivel, quantidadeRestante);

            const novo_valor = Number(lote.valor_unitario) * Number(lote.quantidade - retirada);

            retiradas.push({
                lote_id: lote.id,
                quantidade_anterior: Number(lote.quantidade).toFixed(3),
                quantidade_retirada: Number(retirada).toFixed(3),
                quantidade_atual: Number(lote.quantidade - retirada).toFixed(3),
                novo_valor_total: Number(novo_valor).toFixed(2)
            });

            quantidadeRestante -= retirada;

        }

        if (quantidadeRestante > 0) {
            return {
                erro: `Estoque insuficiente para insumo ${item.id}`
            };
        }

        resultado.push(...retiradas);

    }

    return resultado;
}

module.exports = distribuirLotes;