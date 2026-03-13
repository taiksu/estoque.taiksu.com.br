const { LoteInsumo, QuantidadeMinima, Sequelize, sequelize } = require('../models');
const publishEvent = require('../client/publishEvent');
const confirmaProcesso = require('../client/confirmaProcesso');

// Excluir Lote
exports.excluir = async (req, res) => {
    try {
        const { motivo, responsavel_cancelamento, id } = req.body;
        console.log('Excluindo lote agora...')

        const lote = await sequelize.transaction(async (t) => {
            const lote = await LoteInsumo.findOne({
                where: {
                    id,
                    unidade_id: req.session.unidade_id
                },
                transaction: t
            });

            if (!lote) {
                return res.status(404).json({ error: 'Lote não encontrado' });
            }

            await lote.update({
                quantidade: 0,
                valor_total: 0,
                responsavel_id: responsavel_cancelamento
            }, {
                transaction: t
            });

            return lote;
        });

        publishEvent({
            eventId: 88,
            payload: {
                motivo,
                lote,
                responsavel_cancelamento,
                id
            },
            userId: req.session.id_user,
            priority: 'high'
        })

        res.status(200).json({ success: true, message: 'Lote excluído com sucesso' });

    } catch (error) {
        console.log('Erro ao excluir lote:', error)
    }
};

// Zerar lote - Action
exports.desfazer = async (req, res) => {
    try {
        const { lote_id, responsavel_id } = req.body;
        console.log('Excluindo lote agora...')

        const lote = await sequelize.transaction(async (t) => {
            const lote = await LoteInsumo.findOne({
                where: {
                    id: lote_id
                },
                transaction: t
            });

            if (!lote) {
                return res.status(404).json({ error: 'Lote não encontrado' });
            }

            await lote.update({
                quantidade: 0,
                valor_total: 0,
                responsavel_id
            }, {
                transaction: t
            });

            return lote;
        });

        publishEvent({
            eventId: 88,
            payload: {
                motivo,
                lote,
                responsavel_cancelamento,
                id
            },
            userId: req.session.id_user,
            priority: 'high'
        })

        res.status(200).json({ success: true, message: 'Lote excluído com sucesso' });

    } catch (error) {
        console.log('Erro ao excluir lote:', error)
    }
};

// Cancelamento de limpeza - remover lote
exports.excluirLimpeza = async (req, res) => {
    try {
        const { id } = req.body;
        console.log('Excluindo lote da limpeza de salmão agora...')

        const lote = await sequelize.transaction(async (t) => {
            const lote = await LoteInsumo.findOne({
                where: {
                    id
                },
                transaction: t
            });

            if (!lote) {
                return res.status(404).json({ error: 'Lote não encontrado' });
            }

            await lote.update({
                quantidade: 0,
                valor_total: 0,
                responsavel_id: 0
            }, {
                transaction: t
            });

            return lote;
        });

        publishEvent({
            eventId: 89,
            payload: {
                lote
            },
            userId: req.session.id_user,
            priority: 'high'
        })

        res.status(200).json({ success: true, message: 'Lote excluído com sucesso' });

    } catch (error) {
        console.log('Erro ao excluir lote:', error)
    }
};


// Exibir todos lotes de um item
exports.show = async (req, res, next) => {
    try {
        const { id } = req.params;
        const unidade_id = req.session.unidade_id;

        if (!unidade_id) {
            return res.status(401).json({ error: 'Unidade não identificada' });
        }

        // Encontra lotes do insumo
        const lotes = await LoteInsumo.findAll({
            where: {
                insumo_id: id,
                unidade_id: unidade_id
            },
            order: [
                ['createdAt', 'DESC']
            ]
        });

        // Soma valor de todos os valotes
        const valorTotal = lotes.reduce((acc, lote) => {
            return acc + Number(lote.valor_total);
        }, 0);

        // Tem que desestruturar porque o findOrCreate retorna um array
        const [quantidadeMinima, created] = await QuantidadeMinima.findOrCreate({
            where: {
                insumo_id: id,
                unidade_id: unidade_id
            },
            defaults: {
                quantidade: 0
            }
        });

        // Busca informações do insumo
        const response = await fetch(`https://insumos.taiksu.com.br/insumos/${id}`);
        const insumo = await response.json();

        // Lotes com quantidade maior que zero
        const lotesAtivos = lotes.filter(lote => lote.quantidade > 0);
        const lotesAcabados = lotes.filter(lote => lote.quantidade <= 0);

        // Quantidade total de lotes
        const quantidadeTotal = lotes.reduce((acc, lote) => {
            return acc + Number(lote.quantidade);
        }, 0);

        res.locals.lotes = lotes;
        res.locals.quantidadeMinima = quantidadeMinima;
        res.locals.valorTotal = valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        res.locals.lotesAtivos = lotesAtivos;
        res.locals.lotesAcabados = lotesAcabados;
        res.locals.insumo = insumo;
        res.locals.quantidadeTotal = quantidadeTotal;
        next();

    } catch (error) {
        console.error('Erro ao buscar insumo:', error);
        res.status(500).json({ error: 'Erro ao buscar insumo' });
    }
};

// Exibir quantidade de um item no estoque
exports.emEstoque = async (req, res, next) => {
    try {
        const { id, unidade } = req.params;
        console.log(req.params);

        if (!unidade) {
            return res.status(401).json({ error: 'Unidade não identificada' });
        }

        // Encontra lotes do insumo
        const lotes = await LoteInsumo.findAll({
            where: {
                insumo_id: id,
                unidade_id: unidade
            },
            order: [
                ['createdAt', 'DESC']
            ]
        });

        // Soma valor de todos os valotes
        const valorTotal = lotes.reduce((acc, lote) => {
            return acc + Number(lote.valor_total);
        }, 0);

        // Soma quantidade de todos os lotes
        const quantidadeTotal = lotes.reduce((acc, lote) => {
            return acc + Number(lote.quantidade);
        }, 0);

        res.status(200).json({
            valor_total: valorTotal,
            quantidade: quantidadeTotal
        });

    } catch (error) {
        console.error('Erro ao buscar insumo:', error);
        res.status(500).json({ error: 'Erro ao buscar insumo' });
    }
};