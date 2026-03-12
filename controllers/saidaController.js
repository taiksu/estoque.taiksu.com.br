// Controller responsável pelas regras de negócio de saída de estoque, mecanismo FIFO, total em insumos, etc..
const distribuirLotes = require('../functions/saida/distribuirLotes'); 
const publishEvent = require('../client/publishEvent');
const { LoteInsumo } = require('../models');

exports.saidaManual = async (req, res, next) => {
    try {
        const { itens, lista_saida } = req.body;

        // Retorna array de lotes e quantidade a ser retirada de cada um
        const retiradas_lotes = await distribuirLotes(itens, lista_saida);

        // Subtrai a quantidade retirada do lote
        const lotes_atualizados = await Promise.all(

            retiradas_lotes.map(async lote => {

                const atualizados = await LoteInsumo.update(
                    {
                        quantidade: lote.quantidade_atual,
                        valor_total: lote.novo_valor_total
                    },
                    {
                        where: {
                            id: lote.lote_id
                        }
                    }
                );

                return atualizados;
            })

        );

        // Publica evento de saída de estoque
        await publishEvent({
            eventId: 11,
            payload: {
                lista_saida,
                retiradas_lotes,
            },
            userId: req.body.lista_saida.responsavel_id,
            priority: 'medium'
        });

        res.json({lista_saida, retiradas_lotes});

    } catch (error) {
        next(error);
    }

};