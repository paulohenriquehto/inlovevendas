const XLSX = require('xlsx');
const fs = require('fs');
const Papa = require('papaparse');

console.log('=== VERIFICAÇÃO DE DADOS - WORDPRESS ===\n');

// Converter data serial do Excel
function excelDateToJSDate(serial) {
  if (!serial || isNaN(serial)) return '';
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);

  const year = date_info.getUTCFullYear();
  const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date_info.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// 1. Ler XLSX
const workbook = XLSX.readFile('/Users/paulo/Projeto/dados site/dashboard-vendas/wordpess/vendas12.xlsx');
const sheetName = workbook.SheetNames[0];
const xlsxData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log(`📊 XLSX carregado: ${xlsxData.length} linhas`);

// 2. Ler CSV
const csvContent = fs.readFileSync('/Users/paulo/Projeto/dados site/dashboard-vendas/wordpess/vendas word.csv', 'utf-8');
const csvData = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;

console.log(`📊 CSV carregado: ${csvData.length} linhas\n`);

// 3. Agrupar por pedido
const pedidosPorNumero = {};
xlsxData.forEach(row => {
  const orderNum = String(row['Order Number'] || '').trim();
  if (!orderNum) return;

  if (!pedidosPorNumero[orderNum]) {
    pedidosPorNumero[orderNum] = [];
  }
  pedidosPorNumero[orderNum].push(row);
});

const totalPedidosUnicos = Object.keys(pedidosPorNumero).length;
console.log(`📦 Total de Pedidos Únicos: ${totalPedidosUnicos}`);

// 4. Calcular Receita Total e Produtos Vendidos
let receitaTotal = 0;
let totalItensVendidos = 0;
const pedidosProcessados = new Set();

Object.entries(pedidosPorNumero).forEach(([orderNum, items]) => {
  const firstItem = items[0];
  const orderTotal = parseFloat(String(firstItem['Order Total Amount'] || 0));

  if (!pedidosProcessados.has(orderNum)) {
    receitaTotal += orderTotal;
    pedidosProcessados.add(orderNum);
  }

  // Contar itens
  items.forEach(item => {
    const qty = parseInt(String(item['Quantity (- Refund)'] || 0));
    totalItensVendidos += qty;
  });
});

console.log(`💰 Receita Total: R$ ${receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
console.log(`📦 Produtos Vendidos: ${totalItensVendidos}`);

// 5. Ticket Médio
const ticketMedio = receitaTotal / totalPedidosUnicos;
console.log(`🎯 Ticket Médio: R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

// 6. Clientes Únicos
const emailsUnicos = new Set();
xlsxData.forEach(row => {
  const email = (row['Email (Billing)'] || '').toLowerCase().trim();
  if (email) emailsUnicos.add(email);
});

const totalClientesUnicos = emailsUnicos.size;
console.log(`\n👥 Total de Clientes Únicos: ${totalClientesUnicos}`);

// 7. Pedidos por Cliente
const pedidosPorCliente = {};
Object.entries(pedidosPorNumero).forEach(([orderNum, items]) => {
  const email = (items[0]['Email (Billing)'] || '').toLowerCase().trim();
  if (!email) return;

  if (!pedidosPorCliente[email]) {
    pedidosPorCliente[email] = new Set();
  }
  pedidosPorCliente[email].add(orderNum);
});

// 8. Clientes Recorrentes (2+ pedidos)
let clientesRecorrentes = 0;
Object.values(pedidosPorCliente).forEach(pedidos => {
  if (pedidos.size >= 2) {
    clientesRecorrentes++;
  }
});

console.log(`🔄 Clientes Recorrentes (2+ pedidos): ${clientesRecorrentes}`);

// 9. Taxa de Recompra
const taxaRecompra = (clientesRecorrentes / totalClientesUnicos) * 100;
console.log(`📈 Taxa de Recompra: ${taxaRecompra.toFixed(1)}%`);

// 10. Ticket por Cliente
const ticketPorCliente = receitaTotal / totalClientesUnicos;
console.log(`💎 Ticket por Cliente: R$ ${ticketPorCliente.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

// 11. Comparação com dados esperados
console.log('\n=== COMPARAÇÃO ===');
const esperado = {
  receitaTotal: 1087393.15,
  totalPedidos: 3100,
  ticketMedio: 350.77,
  produtosVendidos: 8149,
  totalClientes: 147,
  taxaRecompra: 10.2,
  ticketPorCliente: 7397.23,
  clientesRecorrentes: 15
};

console.log('\nEsperado vs Calculado:');
console.log(`Receita Total: R$ ${esperado.receitaTotal.toLocaleString('pt-BR')} vs R$ ${receitaTotal.toLocaleString('pt-BR')} - ${receitaTotal === esperado.receitaTotal ? '✅' : '❌'}`);
console.log(`Total Pedidos: ${esperado.totalPedidos} vs ${totalPedidosUnicos} - ${totalPedidosUnicos === esperado.totalPedidos ? '✅' : '❌'}`);
console.log(`Ticket Médio: R$ ${esperado.ticketMedio} vs R$ ${ticketMedio.toFixed(2)} - ${Math.abs(ticketMedio - esperado.ticketMedio) < 0.01 ? '✅' : '❌'}`);
console.log(`Produtos Vendidos: ${esperado.produtosVendidos} vs ${totalItensVendidos} - ${totalItensVendidos === esperado.produtosVendidos ? '✅' : '❌'}`);
console.log(`Total Clientes: ${esperado.totalClientes} vs ${totalClientesUnicos} - ${totalClientesUnicos === esperado.totalClientes ? '✅' : '❌'}`);
console.log(`Taxa Recompra: ${esperado.taxaRecompra}% vs ${taxaRecompra.toFixed(1)}% - ${Math.abs(taxaRecompra - esperado.taxaRecompra) < 0.1 ? '✅' : '❌'}`);
console.log(`Ticket/Cliente: R$ ${esperado.ticketPorCliente} vs R$ ${ticketPorCliente.toFixed(2)} - ${Math.abs(ticketPorCliente - esperado.ticketPorCliente) < 0.01 ? '✅' : '❌'}`);
console.log(`Clientes Recorrentes: ${esperado.clientesRecorrentes} vs ${clientesRecorrentes} - ${clientesRecorrentes === esperado.clientesRecorrentes ? '✅' : '❌'}`);

// 12. Análise detalhada de discrepâncias
console.log('\n=== ANÁLISE DETALHADA ===');

// Verificar se há pedidos com valor 0
const pedidosComValorZero = Object.entries(pedidosPorNumero).filter(([num, items]) => {
  return parseFloat(String(items[0]['Order Total Amount'] || 0)) === 0;
});
console.log(`Pedidos com valor 0: ${pedidosComValorZero.length}`);

// Verificar status dos pedidos
const statusCount = {};
Object.entries(pedidosPorNumero).forEach(([num, items]) => {
  const status = items[0]['Order Status'] || 'Unknown';
  statusCount[status] = (statusCount[status] || 0) + 1;
});
console.log('\nDistribuição por Status:');
Object.entries(statusCount).forEach(([status, count]) => {
  console.log(`  ${status}: ${count} pedidos`);
});

// Top 5 clientes por número de pedidos
console.log('\nTop 5 Clientes por Número de Pedidos:');
const clientesOrdenados = Object.entries(pedidosPorCliente)
  .map(([email, pedidos]) => ({ email, count: pedidos.size }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 5);

clientesOrdenados.forEach((cliente, idx) => {
  console.log(`  ${idx + 1}. ${cliente.email}: ${cliente.count} pedidos`);
});
