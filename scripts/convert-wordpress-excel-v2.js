const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Caminho dos arquivos
const inputFile = path.join(__dirname, '..', '..', 'wordpess', 'vendas12.xlsx');
const outputFile = path.join(__dirname, '..', 'public', 'vendas-wordpress.csv');

console.log('🔄 Conversão WordPress Excel v2 - Processando vendas12.xlsx');
console.log('Input:', inputFile);
console.log('Output:', outputFile);

try {
  // Ler arquivo Excel
  const workbook = XLSX.readFile(inputFile);
  
  // Pegar a primeira planilha
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Converter para JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`Total de linhas na planilha: ${data.length}`);
  
  if (data.length === 0) {
    console.error('Planilha vazia!');
    process.exit(1);
  }
  
  // Headers da planilha de entrada
  const headers = data[0];
  console.log('Headers encontrados:', headers.length);
  
  // Headers do arquivo de saída (formato padrão)
  const outputHeaders = [
    'Número do Pedido', 'E-mail', 'Data', 'Status do Pedido', 'Status do Pagamento',
    'Status do Envio', 'Moeda', 'Subtotal', 'Desconto', 'Valor do Frete', 'Total',
    'Nome do comprador', 'CPF / CNPJ', 'Telefone', 'Nome para a entrega',
    'Telefone para a entrega', 'Endereço', 'Número', 'Complemento', 'Bairro',
    'Cidade', 'Código postal', 'Estado', 'País', 'Forma de Entrega',
    'Forma de Pagamento', 'Cupom de Desconto', 'Anotações do Comprador',
    'Anotações do Vendedor', 'Data de pagamento', 'Data de envio', 'Nome do Produto',
    'Valor do Produto', 'Quantidade Comprada', 'SKU', 'Canal',
    'Código de rastreio do envio', 'Identificador da transação no meio de pagamento',
    'Identificador do pedido', 'Produto Fisico', 'Pessoa que registrou a venda',
    'Local de venda', 'Vendedor', 'Data e hora do cancelamento', 'Motivo do cancelamento'
  ];
  
  // Função auxiliar para limpar valores
  function cleanValue(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }
  
  // Função auxiliar para converter número
  function parseNumber(value) {
    if (!value) return 0;
    const cleaned = String(value).replace(/[R$\s.]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  
  // Função para converter data Excel (número serial) para string
  function excelDateToString(excelDate) {
    if (!excelDate) return '01/10/2022';
    
    // Se for número (data serial do Excel)
    if (typeof excelDate === 'number') {
      // Data base do Excel: 1 de janeiro de 1900
      const baseDate = new Date(1900, 0, 1);
      const targetDate = new Date(baseDate.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
      return targetDate.toLocaleDateString('pt-BR');
    }
    
    // Se já for string, retornar como está
    return cleanValue(excelDate);
  }
  
  // Array para armazenar linhas de saída
  const outputLines = [];
  outputLines.push(outputHeaders.map(h => `"${h}"`).join(';'));
  
  let totalPedidos = 0;
  let totalLinhas = 0;
  
  // Mapeamento de colunas específicas
  const orderNumberIdx = 0; // Order Number
  const emailIdx = 23; // Email (Billing)
  const firstNameIdx = 15; // First Name (Billing)
  const lastNameIdx = 16; // Last Name (Billing)
  const orderDateIdx = 10; // Order Date
  const orderStatusIdx = 11; // Order Status
  const orderTotalIdx = 39; // Order Total Amount
  const orderSubtotalIdx = 35; // Order Subtotal Amount
  const orderShippingIdx = 37; // Order Shipping Amount
  const orderDiscountIdx = 33; // Cart Discount Amount
  const paymentMethodIdx = 32; // Payment Method Title
  const shippingMethodIdx = 36; // Shipping Method Title
  const cityIdx = 19; // City (Billing)
  const stateIdx = 20; // State Code (Billing)
  const postcodeIdx = 21; // Postcode (Billing)
  const addressIdx = 18; // Address 1&2 (Billing)
  const phoneIdx = 24; // Phone (Billing)
  const countryIdx = 22; // Country Code (Billing)
  const customerNoteIdx = 14; // Customer Note
  const skuIdx = 41; // SKU
  const productNameIdx = 43; // Item Name
  const quantityIdx = 44; // Quantity (- Refund)
  const itemCostIdx = 45; // Item Cost
  const couponIdx = 46; // Coupon Code
  
  // Processar cada linha (pular header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    // Extrair dados básicos
    const numeroPedido = cleanValue(row[orderNumberIdx]);
    const email = cleanValue(row[emailIdx]);
    const primeiroNome = cleanValue(row[firstNameIdx]);
    const sobrenome = cleanValue(row[lastNameIdx]);
    const nomeCompleto = `${primeiroNome} ${sobrenome}`.trim() || 'Cliente';
    
    const dataPedido = excelDateToString(row[orderDateIdx]);
    const statusPedido = cleanValue(row[orderStatusIdx]) || 'Processing';
    
    // Valores monetários
    const subtotal = parseNumber(row[orderSubtotalIdx]);
    const frete = parseNumber(row[orderShippingIdx]);
    const desconto = parseNumber(row[orderDiscountIdx]);
    const total = parseNumber(row[orderTotalIdx]) || (subtotal + frete - desconto);
    
    // Dados de contato e endereço
    const telefone = cleanValue(row[phoneIdx]);
    const cidade = cleanValue(row[cityIdx]);
    const estado = cleanValue(row[stateIdx]);
    const cep = cleanValue(row[postcodeIdx]);
    const endereco = cleanValue(row[addressIdx]);
    const pais = cleanValue(row[countryIdx]) || 'BR';
    const anotacoes = cleanValue(row[customerNoteIdx]);
    
    // Dados do produto
    const sku = cleanValue(row[skuIdx]);
    const nomeProduto = cleanValue(row[productNameIdx]) || 'Produto WordPress';
    const quantidade = parseNumber(row[quantityIdx]) || 1;
    const valorProduto = parseNumber(row[itemCostIdx]) || (total / quantidade);
    
    // Dados de pagamento e envio
    const formaPagamento = cleanValue(row[paymentMethodIdx]);
    const formaEntrega = cleanValue(row[shippingMethodIdx]) || 'Correios';
    const cupom = cleanValue(row[couponIdx]);
    
    // Se não tem email, gerar um baseado no nome
    const emailFinal = email || (nomeCompleto ? `${nomeCompleto.toLowerCase().replace(/\s+/g, '.')}@wordpress.com` : `cliente${i}@wordpress.com`);
    
    // Mapear status do pedido
    let statusPagamento = 'Confirmado';
    let statusEnvio = 'Enviado';
    
    if (statusPedido.toLowerCase().includes('pending')) {
      statusPagamento = 'Pendente';
      statusEnvio = 'Pendente';
    } else if (statusPedido.toLowerCase().includes('cancel')) {
      statusPagamento = 'Cancelado';
      statusEnvio = 'Cancelado';
    } else if (statusPedido.toLowerCase().includes('refund')) {
      statusPagamento = 'Reembolsado';
      statusEnvio = 'Reembolsado';
    }
    
    totalPedidos++;
    totalLinhas++;
    
    // Criar linha de saída
    const outputLine = [
      numeroPedido, // Número do Pedido
      emailFinal, // E-mail
      dataPedido, // Data
      statusPedido, // Status do Pedido
      statusPagamento, // Status do Pagamento
      statusEnvio, // Status do Envio
      'BRL', // Moeda
      subtotal.toFixed(2).replace('.', ','), // Subtotal
      desconto.toFixed(2).replace('.', ','), // Desconto
      frete.toFixed(2).replace('.', ','), // Valor do Frete
      total.toFixed(2).replace('.', ','), // Total
      nomeCompleto, // Nome do comprador
      '', // CPF / CNPJ
      telefone, // Telefone
      nomeCompleto, // Nome para a entrega
      telefone, // Telefone para a entrega
      endereco, // Endereço
      '', // Número
      '', // Complemento
      '', // Bairro
      cidade, // Cidade
      cep, // Código postal
      estado, // Estado
      'Brasil', // País
      formaEntrega, // Forma de Entrega
      formaPagamento, // Forma de Pagamento
      cupom, // Cupom de Desconto
      anotacoes, // Anotações do Comprador
      '', // Anotações do Vendedor
      dataPedido, // Data de pagamento
      dataPedido, // Data de envio
      nomeProduto, // Nome do Produto
      valorProduto.toFixed(2).replace('.', ','), // Valor do Produto
      quantidade.toString(), // Quantidade Comprada
      sku, // SKU
      'WordPress', // Canal
      '', // Código de rastreio
      numeroPedido, // Identificador da transação
      numeroPedido, // Identificador do pedido
      'Sim', // Produto Fisico
      '', // Pessoa que registrou a venda
      'WordPress', // Local de venda
      '', // Vendedor
      '', // Data de cancelamento
      '' // Motivo do cancelamento
    ];
    
    outputLines.push(outputLine.map(v => `"${v}"`).join(';'));
    
    if (i % 1000 === 0) {
      console.log(`Processadas ${i}/${data.length} linhas...`);
    }
  }
  
  // Escrever arquivo de saída
  fs.writeFileSync(outputFile, outputLines.join('\n'), 'utf8');
  
  console.log('\n✅ Conversão Excel concluída com sucesso!');
  console.log(`📊 Total de pedidos processados: ${totalPedidos}`);
  console.log(`📦 Total de linhas geradas: ${totalLinhas}`);
  console.log(`💾 Arquivo salvo: ${outputFile}`);
  
} catch (error) {
  console.error('❌ Erro ao processar planilha Excel:', error);
  process.exit(1);
}