const XLSX = require('xlsx');
const fs = require('fs');
const Papa = require('papaparse');

// Ler arquivo Excel
const workbook = XLSX.readFile('/Users/paulo/Projeto/dados site/dashboard-vendas/wordpess/vendas12.xlsx');
const sheetName = workbook.SheetNames[0];
const xlsxData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

// Ler arquivo CSV
const csvContent = fs.readFileSync('/Users/paulo/Projeto/dados site/dashboard-vendas/wordpess/vendas word.csv', 'utf-8');
const csvData = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;

console.log('=== Análise Detalhada ===\n');

// Agrupar XLSX por pedido
const xlsxByOrder = {};
xlsxData.forEach(row => {
  const orderNum = row['Order Number'];
  if (!xlsxByOrder[orderNum]) {
    xlsxByOrder[orderNum] = [];
  }
  xlsxByOrder[orderNum].push(row);
});

console.log(`Total de pedidos únicos no XLSX: ${Object.keys(xlsxByOrder).length}`);
console.log(`Total de linhas no CSV: ${csvData.length}`);

// Tentar identificar chave de relação
console.log('\n=== Comparando primeiro registro ===');
console.log('\nXLSX:');
console.log('  Email:', xlsxData[0]['Email (Billing)']);
console.log('  Nome:', xlsxData[0]['First Name (Billing)'], xlsxData[0]['Last Name (Billing)']);
console.log('  Total:', xlsxData[0]['Order Total Amount']);
console.log('  SKU:', xlsxData[0]['SKU']);

console.log('\nCSV:');
console.log('  Email:', csvData[0]['Email (Billing)']);
console.log('  Nome:', csvData[0]['First Name (Billing)']);
console.log('  Subtotal:', csvData[0]['Order Subtotal Amount']);
console.log('  SKU #1:', csvData[0]['SKU #1']);
console.log('  SKU #2:', csvData[0]['SKU #2']);

// Verificar se existem identificadores únicos no CSV
console.log('\n=== Identificadores possíveis no CSV ===');
const csvKeys = Object.keys(csvData[0]);
const possibleIdKeys = csvKeys.filter(key =>
  key.toLowerCase().includes('order') ||
  key.toLowerCase().includes('id') ||
  key.toLowerCase().includes('number')
);
console.log('Colunas que podem ser ID:', possibleIdKeys);

// Mostrar algumas linhas do CSV para entender melhor
console.log('\n=== Primeiras 3 linhas do CSV (campos relevantes) ===');
csvData.slice(0, 3).forEach((row, idx) => {
  console.log(`\nLinha ${idx + 1}:`);
  console.log('  Email:', row['Email (Billing)']);
  console.log('  Nome:', row['First Name (Billing)']);
  console.log('  Subtotal:', row['Order Subtotal Amount']);
  console.log('  Total Pedidos Cliente:', row['Customer Total Orders']);
  console.log('  Total Gasto Cliente:', row['Customer Total Spent']);
});

// Estatísticas
console.log('\n=== Estatísticas ===');
const uniqueEmailsXLSX = new Set(xlsxData.map(r => r['Email (Billing)'])).size;
const uniqueEmailsCSV = new Set(csvData.map(r => r['Email (Billing)'])).size;
console.log(`Emails únicos no XLSX: ${uniqueEmailsXLSX}`);
console.log(`Emails únicos no CSV: ${uniqueEmailsCSV}`);
