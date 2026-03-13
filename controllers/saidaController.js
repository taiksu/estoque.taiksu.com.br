// Controller responsável pelas regras de negócio de saída de estoque, mecanismo FIFO, total em insumos, etc..
const publishEvent = require('../client/publishEvent');
const { LoteInsumo, InsumoSaida, sequelize, ListaSaida } = require('../models');
const { Op } = require('sequelize');

exports.saidaManual = async (req, res) => {
    try {
        console.log('Entrou no controller de saida manual');

        // Busca a lista de saída pendente para a unidade
        const lista_saida = await ListaSaida.findOne({
            where: {
                unidade_id: req.session.unidade_id,
                status: 'pendente'
            }
        });

        // Busca os itens da lista de saída
        const itens_saida = await InsumoSaida.findAll({
            where: {
                lista_saida_id: lista_saida.id
            }
        });

        // Para cada item da lista busca os lotes e distribui a quantidade de forma FIFO
        for (const item of itens_saida) {

            // Busca os lotes validos do item a ser retirado
            const lotes = await LoteInsumo.findAll({
                where: {
                    insumo_id: item.insumo_id,
                    unidade_id: item.unidade_id,
                    quantidade: {
                        [Op.gt]: 0
                    }
                },
                order: [
                    ['data_entrada', 'ASC'] // Ordena os lotes por data de entrada (Mais antigo para mais recente)
                ]
            });

            // Verifica se tem estoque suficiente
            const totalEmEstoque = lotes.reduce((acc, lote) => acc + Number(lote.quantidade), 0);
            console.log('Total em estoque', totalEmEstoque);
            console.log('Quantidade retirada', item.quantidade);
            console.log('tipo do totalEmEstoque', typeof totalEmEstoque);
            console.log('tipo do quantidade_retirada', typeof item.quantidade);
            let quantidadeRestante = Number(item.quantidade);

            // Verifica se tem estoque suficiente
            if(totalEmEstoque < item.quantidade) {
                console.log('Estoque insuficiente para a retirada');
                return res.status(400).json({
                    success: false,
                    mensagem: "Estoque insuficiente para a retirada",
                    insumo_id: item.insumo_id,
                    quantidade_retirada: item.quantidade,
                    totalEmEstoque: totalEmEstoque
                });
                
                
            // Se tiver estoque suficiente, distribui a quantidade da retirada entre os lotes    
            } else {
                for (const lote of lotes) {
                    // Se ainda houver quantidade restante, retira a quantidade do próximo lote
                    if (quantidadeRestante > 0) {
                        const quantidadeRetirada = Math.min(quantidadeRestante, Number(lote.quantidade));
                        quantidadeRestante -= quantidadeRetirada;
                        await LoteInsumo.update({
                            quantidade: Number(lote.quantidade) - quantidadeRetirada,
                            valor_total: Number(lote.valor_total) - quantidadeRetirada * Number(lote.valor_unitario)
                        }, {
                            where: {
                                id: lote.id
                            }
                        });
                    }
                }
                
            }
        }

        // Atualiza o status da lista para concluida
        await lista_saida.update({
            status: 'concluida'
        });

        await publishEvent({
            eventId: 11,
            payload: {
                lista_saida,
                itens_saida
            },
            userId: lista_saida.responsavel_id,
            priority: 'urgent'
        });

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