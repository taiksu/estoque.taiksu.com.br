#!/usr/bin/env node

'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Op } = require('sequelize');

const { LoteInsumo, sequelize } = require('../models');
const publishEvent = require('../client/publishEvent');

sequelize.options.logging = false;

const DEFAULT_CSV_PATH = path.resolve(
  __dirname,
  '../public/doc/catalogo_produtos_unidades_2026_04_13_173001.csv'
);

function parseArgs(argv) {
  const options = {
    csv: DEFAULT_CSV_PATH,
    unidadeId: null,
    dryRun: false,
    publishEvents: true,
  };

  argv.forEach(arg => {
    if (arg === '--dry-run') {
      options.dryRun = true;
      return;
    }

    if (arg === '--sem-evento') {
      options.publishEvents = false;
      return;
    }

    if (arg.startsWith('--csv=')) {
      options.csv = path.resolve(process.cwd(), arg.slice('--csv='.length));
      return;
    }

    if (arg.startsWith('--unidade=')) {
      options.unidadeId = Number.parseInt(arg.slice('--unidade='.length), 10);
    }
  });

  return options;
}

function parseDelimited(text, delimiter = ';') {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }

      row.push(value);
      if (row.some(column => column !== '')) {
        rows.push(row);
      }
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  if (value !== '' || row.length > 0) {
    row.push(value);
    if (row.some(column => column !== '')) {
      rows.push(row);
    }
  }

  return rows;
}

function toNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const normalized = String(value).trim().replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number.parseInt(String(value).trim(), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function toDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(String(value).trim().replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function roundCurrency(value) {
  return Number(Number(value).toFixed(2));
}

function deterministicUuid(seed) {
  const hash = crypto.createHash('sha1').update(seed).digest();

  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;

  const hex = hash.subarray(0, 16).toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

function chunk(array, size) {
  const chunks = [];

  for (let index = 0; index < array.length; index += size) {
    chunks.push(array.slice(index, index + size));
  }

  return chunks;
}

function loadRows(csvPath) {
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const [header, ...dataRows] = parseDelimited(csvContent, ';');

  return dataRows.map(columns => {
    const row = {};

    header.forEach((columnName, index) => {
      row[columnName] = columns[index] ?? '';
    });

    return row;
  });
}

function normalizeRows(rows, unidadeIdFiltro) {
  const errors = [];
  const skipped = [];
  const normalized = [];

  rows.forEach(row => {
    const registroId = toInteger(row.registro_id);
    const unidadeId = toInteger(row.unidade_id);
    const insumoId = toInteger(row.insumo_id_novo);
    const fornecedorId = toInteger(row.fornecedor_id) ?? 9;
    const responsavelId = toInteger(row.usuario_id) ?? 0;
    const quantidade = toNumber(row.quantidade);
    const valorUnitario = toNumber(row.preco_insumo);
    const dataEntrada = toDate(row.created_at);
    const updatedAt = toDate(row.updated_at) || dataEntrada || new Date();
    const operacao = String(row.operacao || '').trim();

    if (unidadeIdFiltro && unidadeId !== unidadeIdFiltro) {
      skipped.push({ registroId, reason: 'unidade-filtrada' });
      return;
    }

    if (operacao.toLowerCase() !== 'entrada') {
      skipped.push({ registroId, reason: `operacao-${operacao || 'vazia'}` });
      return;
    }

    if (!registroId || !unidadeId || !insumoId || quantidade === null || valorUnitario === null) {
      errors.push({
        registroId: registroId || 'desconhecido',
        reason: 'campos-obrigatorios-ausentes',
      });
      return;
    }

    if (quantidade <= 0) {
      skipped.push({ registroId, reason: 'quantidade-menor-ou-igual-zero' });
      return;
    }

    const loteId = deterministicUuid(`catalogo-legado:lote:${registroId}`);
    const grupoId = deterministicUuid(
      `catalogo-legado:grupo:${unidadeId}:${responsavelId}:${fornecedorId}:${row.created_at}`
    );

    normalized.push({
      registro_id_legado: registroId,
      id: loteId,
      grupo_id: grupoId,
      insumo_id: insumoId,
      quantidade,
      quantidade_original: quantidade,
      valor_unitario: valorUnitario,
      valor_total: roundCurrency(quantidade * valorUnitario),
      data_entrada: dataEntrada || updatedAt,
      createdAt: dataEntrada || updatedAt,
      updatedAt,
      fornecedor_id: fornecedorId,
      unidade_id: unidadeId,
      responsavel_id: responsavelId,
      nome_produto: row.nome_produto,
      unidade_medida: row.unidade_medida,
    });
  });

  return { normalized, errors, skipped };
}

async function findExistingIds(ids) {
  const existingIds = new Set();

  for (const idChunk of chunk(ids, 200)) {
    const rows = await LoteInsumo.findAll({
      attributes: ['id'],
      where: {
        id: {
          [Op.in]: idChunk,
        },
      },
      paranoid: false,
    });

    rows.forEach(row => existingIds.add(row.id));
  }

  return existingIds;
}

function toPersistedLote(row) {
  return {
    id: row.id,
    insumo_id: row.insumo_id,
    quantidade: row.quantidade,
    quantidade_original: row.quantidade_original,
    valor_unitario: row.valor_unitario,
    valor_total: row.valor_total,
    data_entrada: row.data_entrada,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    fornecedor_id: row.fornecedor_id,
    unidade_id: row.unidade_id,
    responsavel_id: row.responsavel_id,
    grupo_id: row.grupo_id,
  };
}

function buildEventGroups(rows) {
  const groups = new Map();

  rows.forEach(row => {
    if (!groups.has(row.grupo_id)) {
      groups.set(row.grupo_id, {
        lista_entrada: {
          id: row.grupo_id,
          status: 'concluida',
          unidade_id: row.unidade_id,
          responsavel_id: row.responsavel_id,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          origem: 'legado',
        },
        lotes_entrada: [],
        userId: row.responsavel_id,
      });
    }

    groups.get(row.grupo_id).lotes_entrada.push({
      id: row.id,
      insumo_id: row.insumo_id,
      quantidade: row.quantidade,
      quantidade_original: row.quantidade_original,
      valor_unitario: row.valor_unitario,
      valor_total: row.valor_total,
      fornecedor_id: row.fornecedor_id,
      unidade_id: row.unidade_id,
      responsavel_id: row.responsavel_id,
      grupo_id: row.grupo_id,
      data_entrada: row.data_entrada,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  });

  return [...groups.values()];
}

function printSummary({ csvPath, totalRows, toImport, errors, skipped, existingIds, dryRun, publishEvents }) {
  const skippedByReason = skipped.reduce((accumulator, item) => {
    accumulator[item.reason] = (accumulator[item.reason] || 0) + 1;
    return accumulator;
  }, {});

  console.log('');
  console.log('Resumo da importacao legado');
  console.log(`CSV: ${csvPath}`);
  console.log(`Registros lidos: ${totalRows}`);
  console.log(`Registros validos: ${toImport.length + existingIds.length}`);
  console.log(`Ja importados: ${existingIds.length}`);
  console.log(`Novos para importar: ${toImport.length}`);
  console.log(`Ignorados: ${skipped.length}`);
  console.log(`Invalidos: ${errors.length}`);
  console.log(`Modo dry-run: ${dryRun ? 'sim' : 'nao'}`);
  console.log(`Publicar eventos: ${publishEvents ? 'sim' : 'nao'}`);

  if (skipped.length > 0) {
    console.log('');
    console.log('Ignorados por motivo:');
    Object.entries(skippedByReason).forEach(([reason, count]) => {
      console.log(`- ${reason}: ${count}`);
    });
  }

  if (errors.length > 0) {
    console.log('');
    console.log('Primeiros registros invalidos:');
    errors.slice(0, 10).forEach(item => {
      console.log(`- registro ${item.registroId}: ${item.reason}`);
    });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const csvPath = options.csv;

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV nao encontrado em ${csvPath}`);
  }

  const rows = loadRows(csvPath);
  const { normalized, errors, skipped } = normalizeRows(rows, options.unidadeId);
  const existingIds = await findExistingIds(normalized.map(row => row.id));
  const toImport = normalized.filter(row => !existingIds.has(row.id));

  printSummary({
    csvPath,
    totalRows: rows.length,
    toImport,
    errors,
    skipped,
    existingIds: [...existingIds],
    dryRun: options.dryRun,
    publishEvents: options.publishEvents,
  });

  if (toImport.length === 0 || options.dryRun) {
    return;
  }

  await sequelize.transaction(async transaction => {
    await LoteInsumo.bulkCreate(toImport.map(toPersistedLote), { transaction });
  });

  console.log('');
  console.log(`Lotes importados com sucesso: ${toImport.length}`);

  if (!options.publishEvents) {
    return;
  }

  const groups = buildEventGroups(toImport);
  const failedGroups = [];

  for (const group of groups) {
    try {
      await publishEvent({
        eventId: 10,
        payload: {
          lista_entrada: group.lista_entrada,
          lotes_entrada: group.lotes_entrada,
        },
        userId: group.userId,
        priority: 'urgent',
      });
    } catch (error) {
      failedGroups.push({
        groupId: group.lista_entrada.id,
        error: error.message,
      });
    }
  }

  console.log(`Eventos publicados: ${groups.length - failedGroups.length}/${groups.length}`);

  if (failedGroups.length > 0) {
    console.log('');
    console.log('Falhas ao publicar eventos:');
    failedGroups.forEach(item => {
      console.log(`- grupo ${item.groupId}: ${item.error}`);
    });

    process.exitCode = 2;
  }
}

main()
  .catch(error => {
    console.error('');
    console.error('Erro na importacao legado:');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
