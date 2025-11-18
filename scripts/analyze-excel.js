const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Caminho dos arquivos
const inputFile = path.join(__dirname, '..', '..', 'wordpess', 'vendas12.xlsx');

console.log('🔍 Analisando estrutura da planilha vendas12.xlsx...');

try {
  // Ler arquivo Excel
  const workbook = XLSX.readFile(inputFile);
  
  // Pegar a primeira planilha
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Converter para JSON (apenas primeiras 10 linhas para análise)
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 'A1:AZ10' });
  
  console.log(`Total de linhas na planilha: ${data.length}`);
  
  if (data.length === 0) {
    console.error('Planilha vazia!');
    process.exit(1);
  }
  
  // Headers da planilha de entrada
  const headers = data[0];
  console.log('\n📋 Headers encontrados:');
  headers.forEach((header, index) => {
    console.log(`${index.toString().padStart(2)}: ${header}`);
  });
  
  // Mostrar algumas linhas de exemplo
  console.log('\n📊 Amostra de dados (primeiras 5 linhas após header):');
  for (let i = 1; i < Math.min(6, data.length); i++) {
    console.log(`\nLinha ${i}:`);
    const row = data[i];
    headers.forEach((header, colIndex) => {
      if (colIndex < 15) { // Mostrar apenas primeiras 15 colunas
        console.log(`  ${header}: ${row[colIndex] || ''}`);
      }
    });
  }
  
  // Identificar colunas importantes
  console.log('\n🔍 Mapeamento de colunas importantes:');
  
  const importantColumns = [
    'order', 'pedido', 'number',
    'email', 'e-mail', 'mail',
    'date', 'data', 'time',
    'name', 'nome', 'customer',
    'total', 'valor', 'amount',
    'product', 'produto', 'item',
    'sku', 'code', 'código',
    'quantity', 'quantidade', 'qty',
    'price', 'preço', 'valor',
    'status', 'estado', 'situação'
  ];
  
  importantColumns.forEach(keyword => {
    const foundIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes(keyword)
    );
    if (foundIndex !== -1) {
      console.log(`✅ ${keyword}: Coluna ${foundIndex} - "${headers[foundIndex]}"`);
    }
  });
  
  console.log('\n✅ Análise concluída!');
  
} catch (error) {
  console.error('❌ Erro ao analisar planilha:', error);
  process.exit(1);
}