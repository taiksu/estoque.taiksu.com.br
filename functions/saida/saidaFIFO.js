const lotesValidos = require('../saida/lotesValidos');
const { LoteInsumo } = require('../../models');

async function saidaFIFO(itens_saida, unidadeId, res) {
    let lotesComValor = [];
    try {
        // Para cada item da lista busca os lotes e distribui a quantidade de forma FIFO
        for (const item of itens_saida) {

            // Busca os lotes validos do item a ser retirado
            const lotes = await lotesValidos(unidadeId, item.insumo_id);

            // Verifica se tem estoque suficiente
            const totalEmEstoque = lotes.reduce((acc, lote) => acc + Number(lote.quantidade), 0);
            console.log('Total em estoque', totalEmEstoque);
            console.log('Quantidade retirada', item.quantidade);
            console.log('tipo do totalEmEstoque', typeof totalEmEstoque);
            console.log('tipo do quantidade_retirada', typeof item.quantidade);
            let quantidadeRestante = Number(item.quantidade);

            if(totalEmEstoque < Number(item.quantidade)) {
                // Remove item da lista de saida
                await InsumoSaida.destroy({
                    where: {
                        id: item.id
                    }
                });

                // Retorna o erro para o front
                console.log('Estoque insuficiente para a retirada');
                return res.status(400).json({
                    success: false,
                    mensagem: "Estoque insuficiente para a retirada",
                    motivo:'estoque-baixo',
                    insumo_id: item.insumo_id,
                    quantidade_retirada: item.quantidade,
                    total_em_estoque: totalEmEstoque
                });
                
                
            // Se tiver estoque suficiente, distribui a quantidade da retirada entre os lotes    
            } else {
                for (const lote of lotes) {

                    // Se ainda houver quantidade restante, retira a quantidade do próximo lote
                    if (quantidadeRestante > 0) {
                        
                        const quantidadeRetirada = Math.min(quantidadeRestante, Number(lote.quantidade));
                        quantidadeRestante -= quantidadeRetirada;


                        lotesComValor.push({
                            ...lote.dataValues,
                            quantidade: quantidadeRetirada,
                            valor_total: quantidadeRetirada * Number(lote.valor_unitario)
                        })

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
        return lotesComValor;
    } catch (error) {
        console.log(error);
        throw error;
    }
}
module.exports = saidaFIFO;