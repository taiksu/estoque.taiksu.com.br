const { ListaEntrada, InsumosEntrada, LoteInsumo, sequelize } = require('../models');
const publishEvent = require('../client/publishEvent');


exports.index = async (req, res) => {
    try {
        const { unidade_id } = req.query;

        // Busca a lista de entrada pendente
        const info_lista = await ListaEntrada.findOne({
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
                insumos_entrada: [],
                message: 'Nenhuma lista de entrada encontrada'
            });
        }

        // Busca os insumos da lista de entrada
        const insumos_entrada = await InsumosEntrada.findAll({
            where: {
                lista_entrada_id: info_lista.id
            }
        });

        res.status(200).json({
            info_lista,
            insumos_entrada
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar lista de entrada' });
    }
}

exports.add = async (req, res) => {
    try {
        const { insumo_id, preco, quantidade, fornecedor_id, unidade_id, responsavel_id } = req.body;
        let created = false;
        let listaEntrada;

        if (Number(preco) <= 0 || Number(quantidade) <= 0) {
            return res.status(400).json({ error: 'Preço e quantidade devem ser maiores que zero' });
        }

        // Apaga todas as listas concluidas para evitar erros
        await ListaEntrada.destroy({
            where: {
                status: 'concluida',
                unidade_id
            }
        });

        await sequelize.transaction(async (t) => {
            // Verifica se já existe uma lista de entrada pendente
            [listaEntrada, created] = await ListaEntrada.findOrCreate({ 
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

            // Adiciona o insumo à lista de entrada
            const insumoEntrada = await InsumosEntrada.create({
                insumo_id,
                preco,
                quantidade,
                fornecedor_id,
                responsavel_id,
                lista_entrada_id: listaEntrada.id
            }, { transaction: t });
        });

        res.status(201).json({ success: true, message: 'Insumo adicionado à lista de entrada' });

        // Se a lista foi criada publica um evento de criação
        if (created) {
            publishEvent({
                eventId: 82,
                payload: {
                    listaEntradaId: listaEntrada.id,
                    unidade_id
                },
                userId: responsavel_id,
                priority: 'high'
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Erro ao adicionar lista de entrada' });
    }
}


exports.delete = async (req, res) => {
    try {
        const { id } = req.body;

        console.log('Removendo insumo da lista:', id);

        // Busca o insumo da lista de entrada
        const insumoEntrada = await InsumosEntrada.findOne({
            where: {
                id
            }
        });

        if(!insumoEntrada) {
            return res.status(404).json({ success: false, error: 'Insumo não encontrado' });
        }

        const Lista_entrada = await ListaEntrada.findOne({
            where: {
                id: insumoEntrada.lista_entrada_id
            }
        });

        // Remove o insumo da lista de entrada
        await insumoEntrada.destroy();

        // Encontra o valor total de cada insumo (preco x quantidade)
        const listaTotal = await InsumosEntrada.findAll({
            where: {
                lista_entrada_id: Lista_entrada.id
            },
            attributes: ['preco', 'quantidade']
        });

        // Soma os valores totais de cada insumo
        const somaTotais = listaTotal.reduce((total, item) => total + Number(item.preco) * Number(item.quantidade), 0);

        console.log('Valor total atualizado:', somaTotais);

        res.status(200).json({ success: true, total_lista: somaTotais, message: 'Insumo removido da lista de entrada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Erro ao remover insumo da lista de entrada' });
    }
}

