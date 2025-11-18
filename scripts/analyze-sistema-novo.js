const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const inputFile = path.join(__dirname, '..', '..', 'Sistema-novo', 'relatorio-pedidos-completo-2025-11-17.xlsx');

function getSheetHeaders(worksheet) {
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  return Array.isArray(data) && data.length > 0 ? data[0] : [];
}

function getRowCount(worksheet) {
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  const totalRows = range.e.r - range.s.r + 1;
  return totalRows > 0 ? totalRows - 1 : 0;
}

function sampleColumnValues(worksheet, columnIndex, maxSamples = 10) {
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const samples = [];
  for (let i = 1; i < data.length && samples.length < maxSamples; i++) {
    const row = data[i];
    const val = row[columnIndex];
    if (val !== undefined && val !== null && val !== '') samples.push(val);
  }
  return samples;
}

function detectDateFormat(samples) {
  const formats = new Set();
  for (const s of samples) {
    const v = String(s);
    if (/\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}/.test(v)) formats.add('dd/MM/yyyy HH:mm');
    else if (/\d{2}\/\d{2}\/\d{4}/.test(v)) formats.add('dd/MM/yyyy');
    else if (/\d{4}-\d{2}-\d{2}/.test(v)) formats.add('yyyy-MM-dd');
  }
  return Array.from(formats);
}

function detectCurrencyFormat(samples) {
  const formats = new Set();
  for (const s of samples) {
    const v = String(s);
    if (/^R\$\s?\d{1,3}(\.\d{3})*,\d{2}$/.test(v)) formats.add('R$ 1.234,56');
    else if (/^\d+(,\d{2})$/.test(v)) formats.add('1.234,56');
  }
  return Array.from(formats);
}

function countMultiItemOrders(worksheet, orderHeaderName) {
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (!data || data.length < 2) return { uniqueOrders: 0, multiItemOrders: 0 };
  const headers = data[0].map(h => (h ? String(h).trim() : ''));
  const idx = headers.findIndex(h => h.toLowerCase() === orderHeaderName.toLowerCase());
  if (idx === -1) return { uniqueOrders: 0, multiItemOrders: 0 };
  const counts = new Map();
  for (let i = 1; i < data.length; i++) {
    const order = data[i][idx];
    if (order) counts.set(order, (counts.get(order) || 0) + 1);
  }
  let multi = 0;
  for (const c of counts.values()) if (c > 1) multi++;
  return { uniqueOrders: counts.size, multiItemOrders: multi };
}

function analyzeSheet(name, worksheet) {
  const headers = getSheetHeaders(worksheet);
  const rowCount = getRowCount(worksheet);
  const headerReport = headers.map((h, i) => ({ index: i, name: h }));

  const dateColumns = [];
  const moneyColumns = [];
  headers.forEach((h, i) => {
    const label = String(h || '').toLowerCase();
    if (label.includes('data')) {
      const samples = sampleColumnValues(worksheet, i, 10);
      const formats = detectDateFormat(samples);
      dateColumns.push({ index: i, name: h, formats, sample: samples.slice(0, 3) });
    }
    if (label.includes('subtotal') || label.includes('desconto') || label.includes('frete') || label.includes('total') || label.includes('preço') || label.includes('valor')) {
      const samples = sampleColumnValues(worksheet, i, 10);
      const formats = detectCurrencyFormat(samples);
      moneyColumns.push({ index: i, name: h, formats, sample: samples.slice(0, 3) });
    }
  });

  return { name, rowCount, headers: headerReport, dateColumns, moneyColumns };
}

function main() {
  console.log('🔍 Analisando planilha do Sistema Novo');
  console.log('Arquivo:', inputFile);

  if (!fs.existsSync(inputFile)) {
    console.error('Arquivo não encontrado');
    process.exit(1);
  }

  const workbook = XLSX.readFile(inputFile);
  const sheetNames = workbook.SheetNames;

  console.log('Planilhas encontradas:', sheetNames.length);
  console.log('Nomes:', sheetNames.join(', '));

  const report = [];
  for (const name of sheetNames) {
    const ws = workbook.Sheets[name];
    report.push(analyzeSheet(name, ws));
  }

  let multiItemInfo = null;
  const itemsSheetName = sheetNames.find(n => n.toLowerCase().includes('item')) || 'Itens dos Pedidos';
  const itemsSheet = workbook.Sheets[itemsSheetName];
  if (itemsSheet) {
    multiItemInfo = countMultiItemOrders(itemsSheet, 'Número do Pedido');
  }

  console.log('\n===== Relatório da Estrutura =====');
  report.forEach(r => {
    console.log(`\n[${r.name}]`);
    console.log(`Registros: ${r.rowCount}`);
    console.log('Colunas:');
    r.headers.forEach(h => {
      console.log(`${h.index.toString().padStart(2)}: ${h.name}`);
    });
    if (r.dateColumns.length > 0) {
      console.log('Colunas de datas:');
      r.dateColumns.forEach(c => {
        console.log(`#${c.index} ${c.name} Formatos: ${c.formats.join(' | ')}`);
        console.log(`Amostras: ${c.sample.join(' ; ')}`);
      });
    }
    if (r.moneyColumns.length > 0) {
      console.log('Colunas monetárias:');
      r.moneyColumns.forEach(c => {
        console.log(`#${c.index} ${c.name} Formatos: ${c.formats.join(' | ')}`);
        console.log(`Amostras: ${c.sample.join(' ; ')}`);
      });
    }
  });

  if (multiItemInfo) {
    console.log('\nItens por pedido (aba itens):');
    console.log(`Pedidos únicos: ${multiItemInfo.uniqueOrders}`);
    console.log(`Pedidos com múltiplos itens: ${multiItemInfo.multiItemOrders}`);
  }

  console.log('\n✅ Análise concluída');
}

main();

