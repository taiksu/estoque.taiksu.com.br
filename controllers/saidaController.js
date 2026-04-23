// Controller responsável pelas regras de negócio de saída de estoque, mecanismo FIFO, total em insumos, etc..
const publishEvent = require('../client/publishEvent');
const confirmaProcesso = require('../client/confirmaProcesso');
const { LoteInsumo, InsumoSaida, sequelize } = require('../models');
const itensSaida = require('../functions/saida/itensSaida');
const { limpaLoteAntigo, saidaFIFO } = require('../functions');
const { Op } = require('sequelize');

exports.saidaManual = async (req, res) => {
    try {
        console.log('Entrou no controller de saida manual');
        let lotesComValor = [];
        const unidadeId = req.session.unidade_id;
        const responsavelId = req.session.id;
        const {itens_saida, lista_saida} = await itensSaida(unidadeId);

        // Para cada item da lista busca os lotes e distribui a quantidade de forma FIFO
        lotesComValor = await saidaFIFO(itens_saida, unidadeId, res);

        // Atualiza o status da lista para concluida
        await lista_saida.update({
            status: 'concluida'
        });

        await publishEvent({
            eventId: 11,
            payload: {
                lista_saida,
                itens_saida: lotesComValor
            },
            userId: lista_saida.responsavel_id,
            priority: 'urgent'
        });

        await limpaLoteAntigo();

        res.json({
            success: true,
            mensagem: "Saída manual realizada com sucesso"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            mensagem: "Erro ao realizar saída manual",
            error: error.message
        });
    }
};

// Devolve ao estoque
exports.desfazer = async (req, res) => {
    try {
        const { lote_id, quantidade, unidade_id } = req.body;
        const deliveryId = req.headers['delivery-id'];

        console.log('Devolvendo ao estoque');

        await sequelize.transaction(async (t) => {
            const lote = await LoteInsumo.findOne({
                where: {
                    id: lote_id,
                    unidade_id
                }
            }, { transaction: t });

            const quantidadeAtualizada = Number(lote.quantidade) + Number(quantidade);
            const valorTotalAtualizado = Number(lote.valor_total) + Number(quantidade) * Number(lote.valor_unitario);

            await LoteInsumo.update({
                quantidade: quantidadeAtualizada,
                valor_total: valorTotalAtualizado,
            }, {
                where: {
                    id: lote_id,
                    unidade_id
                }
            }, { transaction: t });
        });

        // Marca como processado no Event Broker
        await confirmaProcesso(deliveryId);

        // Pulbica evento
        await publishEvent({
            eventId: 96,
            payload: {
                lote_id,
                quantidade_devolvida: quantidade,
                unidade_id
            },
            userId: 0,
            priority: 'high'
        });

        res.json({
            success: true,
            mensagem: "Devolução ao estoque realizada com sucesso"
        });
        
    } catch (error) {
        console.log(error);
        throw error;
    }
};