const { ListaEntrada, InsumosEntrada, LoteInsumo, sequelize } = require('../models');
const publishEvent = require('../client/publishEvent');
const { validaLista } = require('../functions');
const { confirmaProcesso } = require('../client');


// Busca todas as listas de entrada de pedidos
exports.index = async (req, res, next) => {
    try {
        const unidade_id = req.session.unidade_id;

        const info_lista = await ListaEntrada.findAll({
            where: {
                status: 'pendente',
                origem: 'pedido',
                unidade_id
            },
            include: [
                {
                    model: InsumosEntrada,
                    attributes: ['id', 'insumo_id', 'quantidade', 'preco', 'fornecedor_id', 'responsavel_id', 'lista_entrada_id']
                }
            ],
            order: [
                ['createdAt', 'DESC'] // Mais recente primeiro
            ],
            limit: 4
        });

        const listasPedidos = info_lista.map(lista => {
            lista.total = lista.InsumosEntradas.reduce((acc, item) => acc + item.quantidade * item.preco, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            lista.quantidade_itens = lista.InsumosEntradas.length;

            return lista;
        }).filter(lista => lista.quantidade_itens > 0);

        validaLista(listasPedidos, res);
        res.locals.listasPedidos = listasPedidos;
        next();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar lista de entrada' });
    }
}

// Cria lista de entrada com base nos itens do pedido
exports.create = async (req, res, next) => {
    try {
        const deliveryId = req.headers['delivery-id'];
        const { pedido_criado, itens_pedido } = req.body;
        let lista_entrada;

        sequelize.transaction(async (t) => {
            lista_entrada = await ListaEntrada.create({
                unidade_id: pedido_criado.unidade_id,
                responsavel_id: pedido_criado.responsavel_id,
                pedido_id: pedido_criado.id,
                status: 'pendente',
                origem: 'pedido'
            });

            itens_pedido.forEach(item => {
                InsumosEntrada.create({
                    lista_entrada_id: lista_entrada.id,
                    insumo_id: item.insumo_id,
                    quantidade: item.quantidade,
                    responsavel_id: pedido_criado.responsavel_id,
                    fornecedor_id: pedido_criado.fornecedor_id,
                    preco: item.preco_unitario
                });
            });
        });

        console.log('Lista de entrada criada');
        await confirmaProcesso(deliveryId);

        await publishEvent({
            eventId: 104,
            payload: {
                lista_entrada,
                itens_pedido
            },
            userId: pedido_criado.responsavel_id,
            priority: 'medium'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar lista de entrada' });
    }
}

// Retorna lista de entrada por pedido
exports.show = async (req, res, next) => {
    try {
        const pedidoId = req.params.pedido;
        const lista_entrada = await ListaEntrada.findOne({
            where: {
                pedido_id: pedidoId
            },
            include: [
                {
                    model: InsumosEntrada,
                    attributes: ['id', 'insumo_id', 'quantidade', 'preco', 'fornecedor_id', 'responsavel_id', 'lista_entrada_id']
                }
            ]
        });
        res.json({ 
            info_lista: lista_entrada,
            insumos_entrada: lista_entrada.InsumosEntradas
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar lista de entrada' });
    }
}

// Processa entrada
exports.entrada = async (req, res, next) => {
    try {
        const { pedido_id } = req.body;
        const responsavelId = req.session.id_user;
        
        const lista_entrada = await ListaEntrada.findOne({
            where: {
                pedido_id
            },
            include: [
                {
                    model: InsumosEntrada
                }
            ]
        });

        lista_entrada.status = 'concluida';
        await lista_entrada.save();

        const itens_entrada = lista_entrada.InsumosEntradas;

        itens_entrada.forEach(async (item) => {
            LoteInsumo.create({
                id: item.id,
                insumo_id: item.insumo_id,
                quantidade: item.quantidade,
                quantidade_original: item.quantidade,
                valor_unitario: item.preco,
                valor_total: item.preco * item.quantidade,
                fornecedor_id: item.fornecedor_id,
                responsavel_id: responsavelId,
                unidade_id: lista_entrada.unidade_id,
                grupo_id: item.lista_entrada_id
            });
        });

        // Formata padrão evento
        const lotes_entrada = lista_entrada.InsumosEntradas.map(item => {
            return {
                id: item.id,
                unidade_id: lista_entrada.unidade_id,
                insumo_id: item.insumo_id,
                lote_id: item.id,
                quantidade: Number(item.quantidade),
                valor_unitario: Number(item.preco).toFixed(2),
                valor_total: Number(item.preco * item.quantidade).toFixed(2),
                responsavel_id: responsavelId,
                grupo_id: item.lista_entrada_id,
                data_movimentacao: lista_entrada.createdAt
            };
        });

        const lista_formatada = {
            id: lista_entrada.id,
            unidade_id: lista_entrada.unidade_id,
            responsavel_id: lista_entrada.responsavel_id,
            pedido_id: lista_entrada.pedido_id,
            status: lista_entrada.status,
            origem: lista_entrada.origem,
            createdAt: lista_entrada.createdAt,
            updatedAt: lista_entrada.updatedAt
        }

        await publishEvent({
            eventId: 12,
            payload: {
                lista_entrada: lista_formatada,
                lotes_entrada
            },
            userId: responsavelId,
            priority: 'urgent'
        });

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao processar entrada' });
    }
}