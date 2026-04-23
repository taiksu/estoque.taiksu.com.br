async function diferencasInsumos(insumos_balanco, lotesAgrupados) {

    // Inicializa arrays de insumos de entrada e saída
    let insumos_entrada = [], insumos_saida = [];
    
    // Para cada insumo do balanço compara quantidade atual com quantidade atualizada
    insumos_balanco.forEach(async (insumo) => {

        // Obtem quantidade atual do insumo em estoque
        let lotes = lotesAgrupados.find(lote => lote.insumo_id === insumo.insumo_id);

        // Se não existir lotes em estoque, considera quantidade 0
        if (!lotes) {
            lotes = {
                quantidade_total: 0,
                valor_total_soma: 0
            };
        }

        // Calcula a diferença entre a quantidade atual e a quantidade atualizada
        const quantidade_atual = Number(insumo.quantidade_atualizada);
        const quantidade_anterior = Number(lotes.quantidade_total);
        const diferenca = quantidade_atual - quantidade_anterior;

        if (diferenca > 0) {
            // Para insumos com quantidade atual maior que a anterior adiciona ao array de entrada
            insumos_entrada.push({
                insumo_id: insumo.insumo_id,
                quantidade_atualizada: quantidade_atual,
                diferenca: Number(diferenca.toFixed(3))
            });
        } else {
            // Para insumos com quantidade atual menor que a anterior adiciona ao array de saída
            insumos_saida.push({
                insumo_id: insumo.insumo_id,
                quantidade_atualizada: quantidade_atual,
                diferenca: Math.abs(Number(diferenca.toFixed(3))) // Remove sinal de negativo
            });
        }
    });

    return {
        insumos_entrada,
        insumos_saida
    };

};

module.exports = diferencasInsumos;