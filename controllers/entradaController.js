const { ListaEntrada, InsumosEntrada, LoteInsumo, sequelize } = require('../models');
const publishEvent = require('../client/publishEvent');


// Processa lista de entrada manual
exports.manual = async (req, res) => {
    try {
        const { unidade_id } = req.body;
        let listaEntradaAtualizada;
        let lotesEntrada;

        await sequelize.transaction(async (t) => {
            // Busca a lista de entrada
            const listaEntrada = await ListaEntrada.findOne({
                where: {
                    unidade_id,
                    status: 'pendente'
                },
                attributes: ['id', 'unidade_id', 'status', 'responsavel_id']
            }, { transaction: t });

            if(!listaEntrada) {
                return res.status(404).json({ success: false, error: 'Lista de entrada não encontrada' });
            }

            // Busca os insumos da lista de entrada
            const insumosEntrada = await InsumosEntrada.findAll({
                where: {
                    lista_entrada_id: listaEntrada.id
                }
            }, { transaction: t });

            if(insumosEntrada.length === 0) {
                return res.status(400).json({ success: false, error: 'Lista de entrada vazia' });
            }

            // Finaliza a lista de entrada
            listaEntradaAtualizada = await listaEntrada.update({
                status: 'concluida',
                responsavel_id: req.session.id_user
            }, { transaction: t });

            // Dá entrada dos insumos no estoque
            lotesEntrada = await LoteInsumo.bulkCreate(insumosEntrada.map(insumo => ({
                insumo_id: insumo.insumo_id,
                quantidade: insumo.quantidade,
                quantidade_original: insumo.quantidade,
                valor_unitario: insumo.preco,
                valor_total: insumo.preco * insumo.quantidade,
                fornecedor_id: insumo.fornecedor_id,
                unidade_id,
                responsavel_id: listaEntrada.responsavel_id,
                grupo_id: listaEntrada.id
            })), { transaction: t });
        });

        // Publica evento de finalização
        publishEvent({
            eventId: 10,
            payload: {
                lista_entrada: listaEntradaAtualizada,
                lotes_entrada: lotesEntrada,
            },
            userId: req.session.id_user,
            priority: 'urgent'
        });

        res.status(200).json({ success: true, message: 'Lista de entrada finalizada com sucesso' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Erro ao finalizar lista de entrada' });
    }
};

// Processa limpeza de salmao
exports.salmao = async (req, res) => {
    try {
        const { unidade_id, id, peso_limpo, responsavel_id, fornecedor, valor_caixa } = req.body;

        const valorKgRecalculado = Number(valor_caixa) / Number(peso_limpo)

        const lote = await LoteInsumo.create({
                id,
                insumo_id: 159,
                quantidade: peso_limpo,
                quantidade_original: peso_limpo,
                valor_unitario: valorKgRecalculado,
                valor_total: valor_caixa,
                fornecedor_id: fornecedor,
                unidade_id,
                responsavel_id,
                grupo_id: id
        })
        

        //evento 87
        publishEvent({
            eventId: 87,
            payload: {
                lote
            },
            userId: responsavel_id,
            priority: 'urgent'
        });

    } catch (error) {
        
    }
};