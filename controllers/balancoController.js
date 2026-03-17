const { InsumoSaida, sequelize, ListaSaida } = require('../models');
const publishEvent = require('../client/publishEvent');

// Adiciona um item à lista de saída
exports.add = async (req, res) => {
    try {
        const { insumo_id, quantidade, unidade_id, responsavel_id } = req.body;
        let created = false;
        let quantidade_itens;
        let listaSaida;

        if (Number(quantidade) <= 0) {
            return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });
        }

        // Apaga todas as listas concluidas para evitar erros
        await ListaSaida.destroy({
            where: {
                status: 'concluida',
                unidade_id
            }
        });

        await sequelize.transaction(async (t) => {
            // Verifica se já existe uma lista de entrada pendente
            [listaSaida, created] = await ListaSaida.findOrCreate({ 
                where: { 
                    status: 'pendente',
                    unidade_id 
                },
                defaults: {
                    unidade_id,
                    responsavel_id
                },
                transaction: t
            });

            // Adiciona o insumo à lista de entrada ou substitui caso já exista
            const [insumoSaida, createdInsumoSaida] = await InsumoSaida.findOrCreate({
                where: {
                    insumo_id,
                    lista_saida_id: listaSaida.id,
                    unidade_id
                },
                defaults: {
                    insumo_id,
                    quantidade,
                    responsavel_id,
                    lista_saida_id: listaSaida.id,
                    unidade_id
                }, transaction: t });

            if (!createdInsumoSaida) {
                await insumoSaida.update({ quantidade }, { transaction: t });
            }

            // Atualiza o responsável da lista
            await listaSaida.update({
                responsavel_id: responsavel_id
            }, { transaction: t });
        });

        // Contabiliza quantidade de itens da lista
        const itens = await InsumoSaida.findAll({
            where: {
                lista_saida_id: listaSaida.id
            }
        })
        quantidade_itens = itens.length;

        res.status(201).json({ success: true, quantidade_itens, message: 'Insumo adicionado à lista de saída' });
        
        // Se a lista foi criada publica um evento de criação
        if (created) {
            publishEvent({
                eventId: 92,
                payload: listaSaida,
                userId: responsavel_id,
                priority: 'low'
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Erro ao adicionar lista de saída' });
    }
}

exports.index = async (req, res) => {
    try {
        const { unidade_id } = req.query;

        // Busca a lista de entrada pendente
        const info_lista = await ListaSaida.findOne({
            where: {
                status: 'pendente',
                unidade_id
            },
            attributes: ['id', 'unidade_id', 'status', 'responsavel_id']
        });

        // Se não existir lista de entrada, retorna vazio
        if (!info_lista) {
            return res.status(200).json({
                info_lista: null,
                insumos_saida: [],
                message: 'Nenhuma lista de saída encontrada'
            });
        }

        // Busca os insumos da lista de entrada
        const insumos_saida = await InsumoSaida.findAll({
            where: {
                lista_saida_id: info_lista.id
            }
        });

        res.status(200).json({
            info_lista,
            insumos_saida
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar lista de saída' });
    }
}
