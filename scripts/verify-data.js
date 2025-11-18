// Script de teste para verificar os dados carregados
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'public', 'vendas-wordpress.csv');

console.log('🔍 Verificando dados do WordPress...');

try {
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  console.log(`📊 Total de linhas no CSV: ${lines.length}`);
  console.log(`📋 Headers: ${lines[0]}`);
  
  // Analisar algumas linhas de exemplo
  const sampleLines = lines.slice(1, 6);
  console.log('\n📋 Amostra de dados:');
  sampleLines.forEach((line, index) => {
    const values = line.split(';');
    console.log(`\nPedido ${index + 1}:`);
    console.log(`  - Número: ${values[0]?.replace(/"/g, '')}`);
    console.log(`  - Email: ${values[1]?.replace(/"/g, '')}`);
    console.log(`  - Total: ${values[10]?.replace(/"/g, '')}`);
    console.log(`  - Produto: ${values[30]?.replace(/"/g, '')}`);
    console.log(`  - SKU: ${values[33]?.replace(/"/g, '')}`);
  });
  
  // Calcular algumas estatísticas básicas
  let totalGeral = 0;
  let totalPedidos = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';');
    const total = parseFloat(values[10]?.replace(/"/g, '').replace(',', '.')) || 0;
    totalGeral += total;
    totalPedidos++;
  }
  
  console.log(`\n💰 Total geral: R$ ${totalGeral.toFixed(2)}`);
  console.log(`📈 Média por pedido: R$ ${(totalGeral / totalPedidos).toFixed(2)}`);
  console.log(`🎯 Total de pedidos: ${totalPedidos}`);
  
  console.log('\n✅ Dados verificados com sucesso!');
  
} catch (error) {
  console.error('❌ Erro ao verificar dados:', error);
  process.exit(1);
}