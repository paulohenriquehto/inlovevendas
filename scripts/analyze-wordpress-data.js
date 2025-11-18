const XLSX = require('xlsx');
const fs = require('fs');
const Papa = require('papaparse');

console.log('=== Análise das Planilhas WordPress ===\n');

// Ler arquivo Excel
console.log('1. Analisando vendas12.xlsx...');
const workbook = XLSX.readFile('/Users/paulo/Projeto/dados site/dashboard-vendas/wordpess/vendas12.xlsx');
const sheetName = workbook.SheetNames[0];
const xlsxData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log(`   - Total de linhas: ${xlsxData.length}`);
console.log(`   - Colunas disponíveis:`);
if (xlsxData.length > 0) {
  Object.keys(xlsxData[0]).forEach(col => {
    console.log(`     * ${col}`);
  });
}
console.log(`   - Primeira linha (exemplo):`);
console.log(JSON.stringify(xlsxData[0], null, 2));

console.log('\n2. Analisando vendas word.csv...');
const csvContent = fs.readFileSync('/Users/paulo/Projeto/dados site/dashboard-vendas/wordpess/vendas word.csv', 'utf-8');
const csvData = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;

console.log(`   - Total de linhas: ${csvData.length}`);
console.log(`   - Colunas disponíveis:`);
if (csvData.length > 0) {
  Object.keys(csvData[0]).forEach(col => {
    console.log(`     * ${col}`);
  });
}
console.log(`   - Primeira linha (exemplo):`);
console.log(JSON.stringify(csvData[0], null, 2));

// Identificar pedidos únicos
console.log('\n3. Identificando pedidos únicos...');
const xlsxOrders = new Set(xlsxData.map(row => row['Número do pedido'] || row['ID'] || row['Order'] || '').filter(Boolean));
const csvOrders = new Set(csvData.map(row => row['Número do pedido'] || row['ID'] || row['Order'] || '').filter(Boolean));

console.log(`   - Pedidos únicos no XLSX: ${xlsxOrders.size}`);
console.log(`   - Pedidos únicos no CSV: ${csvOrders.size}`);

// Encontrar pedidos em comum
const commonOrders = [...xlsxOrders].filter(order => csvOrders.has(order));
console.log(`   - Pedidos em comum: ${commonOrders.length}`);

console.log('\n4. Análise completa!');
