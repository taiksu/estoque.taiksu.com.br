async function atualizaInsumosSaida({itens, listaId, responsavelId, unidadeId}) {
    try {
        // Recebe lista de itens de saída do balanço
        console.log('[atualizaInsumosSaida] itens do balanço', itens);

        // Converte array para o padrão de InsumoSaida
        const itens_saida = itens.map(item => {
            return {
                insumo_id: item.insumo_id,
                quantidade: item.diferenca, // Quantidade a ser retirada
                lista_saida_id: listaId,
                responsavel_id: responsavelId,
                unidade_id: unidadeId
            };
        });
        console.log('[atualizaInsumosSaida] itens do balanço transformados para o padrão de InsumoSaida', itens_saida);
        return itens_saida;
        
    } catch (error) {
        console.log(error);
        throw error;
    }
}

module.exports = atualizaInsumosSaida;