const { LoteInsumo, QuantidadeMinima, Sequelize } = require('../models');
const publishEvent = require('../client/publishEvent');
const { valorTotalEstoque, getInsumos } = require('../functions');
const axios = require('axios');
const { Op } = require('sequelize');

// Retorna insumos com baixa quantidade
exports.baixoEstoque = async (req, res, next) => {
    try {
        const unidadeId = req.session.unidade_id;
        const { valor_total_estoque, lotesAgrupados } = await valorTotalEstoque(unidadeId);
        const insumosBaixoEstoque = [];
        const insumos = await getInsumos();
        
        const quantidadesMinimas = await QuantidadeMinima.findAll({
            where: {
                unidade_id: unidadeId
            },
            attributes: ['insumo_id', 'quantidade', 'unidade_id']
        });

        const quantidadesMinimasMap = {};
        quantidadesMinimas.forEach(quantidadeMinima => {
            quantidadesMinimasMap[quantidadeMinima.insumo_id] = quantidadeMinima.quantidade;
        });
        
        for (let insumo of lotesAgrupados) {
            let quantidadeMinima = quantidadesMinimasMap[insumo.insumo_id];
            const insumoInfo = insumos.find(i => i.id == insumo.insumo_id);
            
            if (quantidadeMinima == null || quantidadeMinima == 0) {
                continue;
            }

            if (insumo.quantidade_total <= quantidadeMinima) {

                let quantidadeMinimaFormatada = quantidadeMinima;

                if (insumoInfo.unidade_medida == 'uni') {
                    quantidadeMinimaFormatada = Number(quantidadeMinima).toFixed(0);
                }

                insumosBaixoEstoque.push({
                    id: insumo.insumo_id,
                    quantidade_total: insumo.quantidade_total,
                    quantidade_minima: quantidadeMinimaFormatada,
                    nome: insumoInfo.nome,
                    unidade_medida: insumoInfo.unidade_medida,
                    foto_url: 'https://insumos.taiksu.com.br' + insumoInfo.foto_url,
                    marca: insumoInfo.marca.nome
                });
            }
        }

        res.locals.quantidadeItensBaixoEstoque = insumosBaixoEstoque.length;
        res.locals.itensBaixoEstoque = insumosBaixoEstoque;
        next();

    } catch (err) {
        throw new Error(err)
    }
};


// Retorna lotes no inventário da loja
exports.listarLotes = async (req, res) => {
    try {

        const unidadeId = req.params.id;
        const { valor_total_estoque, lotesAgrupados } = await valorTotalEstoque(unidadeId);

        // 🔹 2. Converte para objeto simples
        const inventarioMap = {};

        lotesAgrupados.forEach(lote => {
            inventarioMap[lote.insumo_id] = parseFloat(lote.quantidade_total);
        });

        const valorTotalMap = {};

        lotesAgrupados.forEach(lote => {
            valorTotalMap[lote.insumo_id] = parseFloat(lote.valor_total_soma);
        });

        // 🔹 3. Busca insumos de estoque
        const response = await axios.get('https://insumos.taiksu.com.br/insumos?visibilidade=estoque');
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

// Retorna apenas ids de insumos com estoque
exports.listarIdsComEstoque = async (req, res) => {
    try {
        const unidadeId = req.params.id;
        const lotesAgrupados = await LoteInsumo.findAll({
            attributes: [
                'insumo_id',
                [Sequelize.fn('SUM', Sequelize.col('quantidade')), 'quantidade_total']
            ],
            where: {
                unidade_id: unidadeId,
                quantidade: {
                    [Sequelize.Op.gt]: 0
                }
            },
            group: ['insumo_id']
        });
        const disponiveis = lotesAgrupados.map(lote => lote.insumo_id);
        res.json(disponiveis);
    } catch (error) {
        console.error('Erro ao buscar ids com estoque:', error);
        res.status(500).json({ error: 'Erro ao buscar ids com estoque' });
    }
};
