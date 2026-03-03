const { LoteInsumo, QuantidadeMinima, Sequelize } = require('../models');
const publishEvent = require('../client/publishEvent');
const axios = require('axios');

exports.listarLotes = async (req, res) => {
    try {

        const unidadeId = req.params.id;

        // 🔹 1. Agrupa e soma os lotes por insumo
        const lotesAgrupados = await LoteInsumo.findAll({
            attributes: [
                'insumo_id',
                [Sequelize.fn('SUM', Sequelize.col('quantidade')), 'quantidade_total'],
                [Sequelize.fn('SUM', Sequelize.col('valor_total')), 'valor_total_soma']
            ],
            where: {
                unidade_id: unidadeId
            },
            group: ['insumo_id']
        });

        // Valor total no estoque
        const valor_total_estoque = lotesAgrupados.reduce((acc, lote) => {
            return acc + Number(lote.dataValues.valor_total_soma);
        }, 0);

        // 🔹 2. Converte para objeto simples
        const inventarioMap = {};

        lotesAgrupados.forEach(lote => {
            inventarioMap[lote.insumo_id] = parseFloat(lote.dataValues.quantidade_total);
        });

        const valorTotalMap = {};

        lotesAgrupados.forEach(lote => {
            valorTotalMap[lote.insumo_id] = parseFloat(lote.dataValues.valor_total_soma);
        });

        // 🔹 3. Busca insumos globais
        const response = await axios.get('https://insumos.taiksu.com.br/insumos');
        const categorias = response.data;

        // 🔹 4. Junta dados
        const resultadoFinal = [];

        Object.keys(categorias).forEach(categoria => {
            categorias[categoria].forEach(insumo => {

                const quantidade = inventarioMap[insumo.id] || 0;
                const valor_total = valorTotalMap[insumo.id] || 0;

                resultadoFinal.push({
                    id: insumo.id,
                    nome: insumo.nome,
                    categoria: categoria,
                    marca: insumo.marca?.nome || null,
                    foto_url: insumo.foto_url,
                    unidade_medida: insumo.unidade_medida,
                    quantidade: quantidade,
                    valor_total
                });

            });
        });

        res.json({ valor_total_estoque, inventario: resultadoFinal });

    } catch (error) {
        console.error('Erro ao montar inventário completo:', error);
        res.status(500).json({ error: 'Erro ao montar inventário completo' });
    }
};

// Show de Lote Insumo
exports.show = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Encontra lotes do insumo
        const lotes = await LoteInsumo.findAll({
            where: {
                insumo_id: id,
                unidade_id: req.session.unidade_id
            }
        });

        // Soma valor de todos os valotes
        const valorTotal = lotes.reduce((acc, lote) => {
            return acc + Number(lote.valor_total);
        }, 0);

        // Tem que desestruturar porque o findOrCreate retorna um array
        const [quantidadeMinima, created] = await QuantidadeMinima.findOrCreate({
            where: {
                insumo_id: id,
                unidade_id: req.session.unidade_id
            },
            defaults: {
                quantidade: 0
            }
        });

        // Busca informações do insumo
        const response = await fetch(`https://insumos.taiksu.com.br/insumos/${id}`);
        const insumo = await response.json();

        res.locals.lotes = lotes;
        res.locals.quantidadeMinima = quantidadeMinima;
        res.locals.valorTotal = valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        res.locals.insumo = insumo;
        next();

    } catch (error) {
        console.error('Erro ao buscar insumo:', error);
        res.status(500).json({ error: 'Erro ao buscar insumo' });
    }
};

// Retorna lista de quantidades mínimas para a unidade
exports.listarQuantidadesMinimas = async (req, res) => {
    try {
        const unidadeId = req.body.unidade_id;
        const quantidadesMinimas = await QuantidadeMinima.findAll({
            where: {
                unidade_id: unidadeId
            },
            attributes: ['insumo_id', 'quantidade', 'unidade_id']
        });
        res.json(quantidadesMinimas);
        
    } catch (error) {
        console.error('Erro ao buscar quantidades mínimas:', error);
        res.status(500).json({ error: 'Erro ao buscar quantidades mínimas' });
    }
};

// Atualiza quantidade mínima de insumo
exports.atualizarMinima = async (req, res) => {
    try {
        const { insumo_id, quantidade } = req.body;
        const unidade_id = req.session.unidade_id;
        const user_id = req.session.id_user;

        const [quantidadeMinima, created] = await QuantidadeMinima.findOrCreate({
            where: {
                insumo_id,
                unidade_id
            },
            defaults: {
                quantidade
            }
        });

        if (!created) {
            quantidadeMinima.quantidade = quantidade;
            await quantidadeMinima.save();
        }

        res.json({ success: true });

        // Publica evento
        publishEvent({
            eventId: 80,
            payload: {
                insumo_id,
                quantidade,
                unidade_id
            },
            userId: user_id,
            priority: 'low'
        })

    } catch (error) {
        console.error('Erro ao atualizar quantidade mínima:', error);
        res.status(500).json({ error: 'Erro ao atualizar quantidade mínima' });
    }
};