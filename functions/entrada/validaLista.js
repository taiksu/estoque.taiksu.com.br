function validaLista(info_lista, res) {
    // Se não existir lista de entrada, retorna vazio
    if (!info_lista) {
        console.log('[ValidaLista] Nenhuma lista encontrada');
        return res.status(200).json({
            info_lista: null,
            insumos_entrada: [],
            insumos_saida: [],
            message: 'Nenhuma lista encontrada'
        });
    }
}
module.exports = validaLista;