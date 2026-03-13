// Esta função recebe a quantidade total de saída e distribui entre os lotes de forma FIFO
// RETORNO: Array de lotes e quantidade a ser retirada de cada um
const { LoteInsumo, InsumoSaida, ListaSaida } = require('../models')
const { Op } = require('sequelize');

async function validarQuantidadeRetirada(req, res, next) {

    try {

        // Busca lista de saída pendente
        const lista_saida = await ListaSaida.findOne({
            where: {
                unidade_id: req.session.unidade_id,
                status: 'pendente'
            }
        });

        // Busca itens e quantidades da lista de saída
        const itens_saida = await InsumoSaida.findAll({
            where: {
                lista_saida_id: lista_saida.id
            }
        });

        for (const item of itens_saida) {
            let quantidade_retirada = Number(item.quantidade);

            const lotes = await LoteInsumo.findAll({
                where: {
                    insumo_id: item.insumo_id,
                    unidade_id: item.unidade_id,
                    quantidade: {
                        [Op.gt]: 0
                    }
                },
                order: [
                    ['data_entrada', 'ASC']
                ]
            });
            const totalEmEstoque = lotes.reduce((acc, lote) => acc + Number(lote.quantidade), 0);
            console.log('Total em estoque', totalEmEstoque);
            console.log('Quantidade retirada', quantidade_retirada);
            console.log('tipo do totalEmEstoque', typeof totalEmEstoque);
            console.log('tipo do quantidade_retirada', typeof quantidade_retirada);

            if(totalEmEstoque < quantidade_retirada) {
                console.log('Estoque insuficiente para a retirada');
                return res.status(400).json({
                    success: false,
                    mensagem: "Estoque insuficiente para a retirada",
                    insumo_id: item.insumo_id,
                    quantidade_retirada: quantidade_retirada,
                    totalEmEstoque: totalEmEstoque
                });
                
                
            } else {
                req.session.itens_saida = itens_saida;
                next();
            }

        }

    } catch (error) {
        
    }
    
}

module.exports = validarQuantidadeRetirada;