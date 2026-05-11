const { sequelize, ListaBalanco, InsumoBalanco } = require('../models');
const publishEvent = require('../client/publishEvent');
const { valorTotalEstoque, listaBalanco, diferencasInsumos, getInsumos, atualizaInsumosEntrada, atualizaInsumosSaida, saidaFIFO } = require('../functions');

// Verifica se existe uma lista de balanço pendente
exports.verificaListaPendente = async (req, res, next) => {
    const unidadeId = req.session.unidade_id;
    let listaPendente = false;
    const lista = await ListaBalanco.findOne({
        where: {
            status: 'pendente',
            unidade_id: unidadeId
        },
        attributes: ['status'],
        include: [
            {
                model: InsumoBalanco,
                attributes: ['id']
            }
        ]
    });

    if (!lista) {
        return false;
    }

    const tamanhoLista = lista.InsumoBalancos.length;

    if (tamanhoLista > 0) {
        listaPendente = true;
    }
    return listaPendente;
}

exports.descartarListaBalanco = async (req, res) => {
    const unidadeId = req.session.unidade_id;
    const lista = await ListaBalanco.findOne({
        where: {
            status: 'pendente',
            unidade_id: unidadeId
        }
    });

    if (!lista) {
        return res.status(404).json({ success: false, message: 'Lista de balanço não encontrada' });
    }

    await lista.destroy();

    res.status(200).json({ success: true, message: 'Lista de balanço descartada' });
    publishEvent({
        eventId: 106,
        payload: {
            lista_balanco_id: lista.id,
            unidade_id: unidadeId,
        },
            userId: req.session.id_user,
            priority: 'urgent'
        });
}

// Adiciona insumo na lista de balanço
exports.addInsumoBalanco = async (req, res) => {
    const { insumo_id, quantidade_atual } = req.body;
    const unidadeId = req.session.unidade_id;
    const responsavelId = req.session.id_user;
    const { valor_total_estoque, lotesAgrupados } = await valorTotalEstoque(unidadeId);
    let listaBalanco;

    sequelize.transaction(async (t) => {

        // Verifica se existe lista de balanço pendente
        const ListaPendente = await ListaBalanco.findOrCreate({
            where: {
                status: 'pendente',
                unidade_id: unidadeId
            },
            defaults: {
                unidade_id: unidadeId,
                responsavel_id: responsavelId,
                total_anterior: valor_total_estoque
            }, transaction: t
        });

        console.log('FindOrCreate ListaPendente retornou:', ListaPendente);

        [listaBalanco, created] = ListaPendente;

        if (created) {
            publishEvent({
                eventId: 107,
                payload: {
                    lista: ListaPendente
                },
                userId: responsavelId,
                priority: 'high'
            });
        }

        // Encontra quantidade atual
        const lote = lotesAgrupados.find(lote => lote.insumo_id === Number(insumo_id));
        const quantidade_anterior = lote ? lote.quantidade_total : 0;
        console.log('[addInsumoBalanco]: quantidade_anterior do insumo:', quantidade_anterior);

        // Adiciona insumo na lista de balanço
        const [insumoBalanco, insumoExiste] = await InsumoBalanco.findOrCreate({
            where: {
                lista_balanco_id: listaBalanco.id,
                insumo_id: insumo_id,
                unidade_id: unidadeId
            },
            defaults: {
                    lista_balanco_id: listaBalanco.id,
                    insumo_id: insumo_id,
                    quantidade_atualizada: quantidade_atual,
                    quantidade_anterior,
                    unidade_id: unidadeId
                }, transaction: t
            });

            console.log('FindOrCreate InsumoBalanco retornou:', insumoBalanco);
            console.log('insumoExiste:', insumoExiste);

            // Atualiza quantidade se já existir
            if (!insumoExiste) {
                console.log('Insumo já existe na lista de balanço, atualizando quantidade');
                await insumoBalanco.update({
                    quantidade_atualizada: quantidade_atual,
                    quantidade_anterior
                }, { transaction: t });
            }
    });

    res.status(200).json({ success: true, message: 'Insumo adicionado à lista de balanço' });
}

// Remove item da lista de balanço
exports.removerItemBalanco = async (req, res) => {
    const { id } = req.body;
    const unidadeId = req.session.unidade_id;
    const insumoBalanco = await InsumoBalanco.findOne({
        where: {
            id: id,
            unidade_id: unidadeId
        }
    });

    await insumoBalanco.destroy();

    const listaBalanco = await ListaBalanco.findOne({
        where: {
            id: insumoBalanco.lista_balanco_id,
            unidade_id: unidadeId
        },
        include: [
            {
                model: InsumoBalanco,
                attributes: ['id']
            }
        ]
    });

    publishEvent({
        eventId: 108,
        payload: {
            insumo_balanco: insumoBalanco,
            lista_balanco: listaBalanco
        },
            userId: req.session.id_user,
            priority: 'urgent'
        });
    
    res.status(200).json({ success: true, message: 'Item removido da lista de balanço', tamanho_lista: listaBalanco.InsumoBalancos.length });
}

exports.listaItensBalanco = async (req, res) => {
    const unidadeId = req.session.unidade_id;
    const { lotesAgrupados } = await valorTotalEstoque(unidadeId);
    const lista = await listaBalanco(unidadeId);

    if (!lista) {
        return res.status(200).json([]);
    }
    
    // Busca insumos
    const insumos = await getInsumos();
    
    // Junta informações de insumos e lotes com lista de balanço
    listaBalancoCompleta = lista.InsumoBalancos.map(item => {
        const insumo = insumos.find(insumo => insumo.id === item.insumo_id);
        const lotes = lotesAgrupados.find(lote => lote.insumo_id === item.insumo_id) || { quantidade_total: 0, valor_total_soma: 0 };

        // Calcula diferença
        let diferenca = Number(item.quantidade_atualizada) - Number(lotes.quantidade_total);

        // Formata quantidade com base na unidade de medida
        let quantidadeFormatada, quantidadeAnteriorFormatada;
        if (insumo.unidade_medida === 'kg') {
            quantidadeFormatada = item.quantidade_atualizada.replace('.', ',') + ' kg';
            quantidadeAnteriorFormatada = String(lotes.quantidade_total).replace('.', ',') + ' kg';
            diferenca = String(Number(diferenca).toFixed(3)).replace('.', ',') + ' kg';
            
        } else {
            quantidadeFormatada = Number(item.quantidade_atualizada).toFixed(0) + ' uni';
            quantidadeAnteriorFormatada = Number(lotes.quantidade_total).toFixed(0) + ' uni';
            diferenca = Number(diferenca).toFixed(0) + ' uni';
        }
        
        return {
            id: item.id,
            nome: insumo.nome,
            insumo_id: item.insumo_id,
            quantidade_atualizada: quantidadeFormatada,
            quantidade_anterior: quantidadeAnteriorFormatada,
            diferenca,
            foto: 'https://insumos.taiksu.com.br' + insumo.foto_url,
            unidade_medida: insumo.unidade_medida,
            categoria: insumo.categoria.nome
        }
    });

    // Agrupa por categoria
    const listaAgrupada = Object.groupBy(listaBalancoCompleta, item => item.categoria);

    res.status(200).json(listaAgrupada);
}

// Processa balanço
exports.processar = async (req, res) => {
    const unidadeId = req.session.unidade_id;
    const responsavelId = req.session.id_user;
    const { lotesAgrupados } = await valorTotalEstoque(unidadeId);
    const lista = await listaBalanco(unidadeId, res);

    // Obtem saldo em estoque antes de executar o balanço
    const { valor_total_estoque: saldoAnterior } = await valorTotalEstoque(unidadeId);

    // Recebe lista de quantidade atualizada de cada insumo
    const insumos_balanco = lista.InsumoBalancos;

    // Calcula diferenças entre quantidade atualizada e quantidade anterior em estoque
    const { insumos_entrada, insumos_saida } = await diferencasInsumos(insumos_balanco, lotesAgrupados);

    // Efetua movimentações de entrada e de saída
    const itens_entrada = await atualizaInsumosEntrada(insumos_entrada, unidadeId);
    const itens_saida = await atualizaInsumosSaida({itens: insumos_saida, listaId: lista.id, responsavelId, unidadeId});

    // Debita lotes com base na saída FIFO
    const lotesComValor = await saidaFIFO(itens_saida, unidadeId, res);

    // Busca novo valor total do estoque
    const { valor_total_estoque } = await valorTotalEstoque(unidadeId);


    // Atualiza status e timestamp da lista
    await lista.update({
        efetuado_em: new Date(),
        total_atualizado: valor_total_estoque,
        status: 'processado'
    });
    
    const lista_saida = {
        id: lista.id,
        status: 'concluida',
        responsavel_id: responsavelId,
        unidade_id: unidadeId,
        efetuado_em: lista.efetuado_em,
        saldo_total_atual: Number(valor_total_estoque).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        saldo_total_anterior: Number(saldoAnterior).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }

    const quantidade_itens = Number(insumos_entrada.length) + Number(insumos_saida.length);

    await publishEvent({
        eventId: 14,
        payload: {
            lista_saida,
            itens_saida: lotesComValor,
            itens_entrada,
            quantidade_itens
        },
        userId: responsavelId,
        priority: 'urgent'
    });
    
    return res.status(200).json({ success: true });
};

// Histórico de balanços
exports.historico = async (req, res, next) => {
    const unidadeId = req.session.unidade_id;
    const listaBalancos = await ListaBalanco.findAll({
        where: {
            unidade_id: unidadeId,
            status: 'processado'
        },
        attributes: ['id', 'efetuado_em', 'total_atualizado', 'total_anterior'],
        limit: 20,
        order: [
            ['efetuado_em', 'DESC']
        ]
    });
    
    res.locals.listaBalancos = listaBalancos;
    next();
};

exports.detalhesBalanco = async (req, res, next) => {
    const { id } = req.params;
    const unidadeId = req.session.unidade_id;
    const balanco = await ListaBalanco.findOne({
        where: {
            id: id,
            unidade_id: unidadeId
        },
        include: [
            {
                model: InsumoBalanco,
                attributes: ['id', 'insumo_id', 'quantidade_atualizada', 'quantidade_anterior', 'unidade_id']
            }
        ]
    });

    // Busca insumos
    const response = await fetch('https://insumos.taiksu.com.br/insumos');
    const categorias = await response.json();
    const insumos = Object.values(categorias).flat();

    const balancoComInsumos = balanco.InsumoBalancos.map(item => {
        const insumo = insumos.find(insumo => insumo.id === item.insumo_id);
        let diferenca = Number(item.quantidade_atualizada) - Number(item.quantidade_anterior);
        let quantidadeAnteriorFormatada;
        let quantidadeAtualizadaFormatada;
        let diferencaFormatada;
        let corDiferenca;

        if (diferenca > 0) {
            corDiferenca = 'text-green-700';
        } else if (diferenca < 0) {
            corDiferenca = 'text-red-700';
        } else {
            corDiferenca = 'text-gray-500';
        }

        if (insumo.unidade_medida === 'kg') {
            diferencaFormatada = Math.abs(Number(diferenca)).toFixed(3) + ' kg';
            quantidadeAnteriorFormatada = item.quantidade_anterior ? Number(item.quantidade_anterior).toFixed(3) + ' kg' : '0.000 kg';
            quantidadeAtualizadaFormatada = Number(item.quantidade_atualizada).toFixed(3) + ' kg';
        } else {
            diferencaFormatada = Math.abs(Number(diferenca)).toFixed(0) + ' uni';
            quantidadeAnteriorFormatada = Number(item.quantidade_anterior).toFixed(0) + ' uni';
            quantidadeAtualizadaFormatada = Number(item.quantidade_atualizada).toFixed(0) + ' uni';
        }
        
        return {
            ...item,
            id: item.insumo_id,
            nome: insumo.nome,
            foto: 'https://insumos.taiksu.com.br' + insumo.foto_url,
            categoria: insumo.categoria.nome,
            unidade_medida: insumo.unidade_medida,
            quantidade_anterior: quantidadeAnteriorFormatada,
            quantidade_atualizada: quantidadeAtualizadaFormatada,
            diferenca: diferencaFormatada,
            cor: corDiferenca
        }
    });
    
    res.locals.balanco = balanco;
    res.locals.insumos = balancoComInsumos.sort((a, b) => a.nome.localeCompare(b.nome));
    next();
};
