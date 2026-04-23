const { ListaBalanco, InsumoBalanco } = require('../../models');

async function listaBalanco(unidadeId) {
    const lista = await ListaBalanco.findOne({
        where: {
            status: 'pendente',
            unidade_id: unidadeId
        },
        include: [
            {
                model: InsumoBalanco,
                attributes: ['id', 'insumo_id', 'quantidade_atualizada']
            }
        ]
    });

    if (!lista) {
        console.log('Nenhuma lista de balanço encontrada');
        return null;
    }
    
    return lista;
};

module.exports = listaBalanco;