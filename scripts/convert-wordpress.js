const fs = require('fs');
const path = require('path');

// Caminho dos arquivos
const inputFile = path.join(__dirname, '..', '..', 'wordpess', 'vendas word.csv');
const outputFile = path.join(__dirname, '..', 'public', 'vendas-wordpress.csv');

console.log('Iniciando conversão do arquivo WordPress...');
console.log('Input:', inputFile);
console.log('Output:', outputFile);

// Ler arquivo
const content = fs.readFileSync(inputFile, 'latin1');
const lines = content.split('\n').filter(line => line.trim());

console.log(`Total de linhas: ${lines.length}`);

// Parse CSV line (respeitando aspas)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result.map(v => v.replace(/^"|"$/g, ''));
}

// Headers do arquivo de entrada
const headerLine = lines[0];
const headers = parseCSVLine(headerLine);

console.log('Headers encontrados:', headers.length);

// Headers do arquivo de saída (formato Nuvem Shopping)
const outputHeaders = [
  'Número do Pedido',
  'E-mail',
  'Data',
  'Status do Pedido',
  'Status do Pagamento',
  'Status do Envio',
  'Moeda',
  'Subtotal',
  'Desconto',
  'Valor do Frete',
  'Total',
  'Nome do comprador',
  'CPF / CNPJ',
  'Telefone',
  'Nome para a entrega',
  'Telefone para a entrega',
  'Endereço',
  'Número',
  'Complemento',
  'Bairro',
  'Cidade',
  'Código postal',
  'Estado',
  'País',
  'Forma de Entrega',
  'Forma de Pagamento',
  'Cupom de Desconto',
  'Anotações do Comprador',
  'Anotações do Vendedor',
  'Data de pagamento',
  'Data de envio',
  'Nome do Produto',
  'Valor do Produto',
  'Quantidade Comprada',
  'SKU',
  'Canal',
  'Código de rastreio do envio',
  'Identificador da transação no meio de pagamento',
  'Identificador do pedido',
  'Produto Fisico',
  'Pessoa que registrou a venda',
  'Local de venda',
  'Vendedor',
  'Data e hora do cancelamento',
  'Motivo do cancelamento'
];

// Mapeamento de índices do input
const getInputIndex = (name) => headers.findIndex(h =>
  h.toLowerCase().includes(name.toLowerCase())
);

const idxCustomerId = getInputIndex('Customer User ID');
const idxEmail = getInputIndex('Email (Billing)');
const idxFirstName = getInputIndex('First Name (Billing)');
const idxCity = getInputIndex('City (Billing)');
const idxPostcode = getInputIndex('Postcode (Billing)');
const idxPhone = getInputIndex('Phone (Billing)');
const idxOrderSubtotal = getInputIndex('Order Subtotal Amount');
const idxOrderTax = getInputIndex('Order Total Tax Amount');
const idxOrderFee = getInputIndex('Order Total Fee');
const idxPaymentMethod = getInputIndex('Payment Method');
const idxAddress = getInputIndex('Full Adress (Billing)');
const idxShippingAddress = getInputIndex('Full Address (Shipping)');
const idxTotalOrders = getInputIndex('Customer Total Orders');
const idxTotalSpent = getInputIndex('Customer Total Spent');

// Array para armazenar linhas de saída
const outputLines = [];
outputLines.push(outputHeaders.map(h => `"${h}"`).join(';'));

let totalProducts = 0;
let totalOrders = 0;

// Processar cada pedido
for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);

  if (values.length < 10) continue;

  totalOrders++;

  // Dados básicos do pedido
  const customerId = values[idxCustomerId] || '';
  const email = values[idxEmail] || '';
  const firstName = values[idxFirstName] || '';
  const city = values[idxCity] || '';
  const postcode = values[idxPostcode] || '';
  const phone = values[idxPhone] || '';
  const orderSubtotal = values[idxOrderSubtotal] || '0';
  const orderTax = values[idxOrderTax] || '0';
  const orderFee = values[idxOrderFee] || '0';
  const paymentMethod = values[idxPaymentMethod] || '';
  const address = values[idxAddress] || '';
  const shippingAddress = values[idxShippingAddress] || '';
  const customerTotalOrders = values[idxTotalOrders] || '1';
  const totalSpent = values[idxTotalSpent] || '0';

  // Calcular total do pedido
  const subtotal = parseFloat(orderSubtotal.replace(',', '.')) || 0;
  const tax = parseFloat(orderTax.replace(',', '.')) || 0;
  const fee = parseFloat(orderFee.replace(',', '.')) || 0;
  const total = subtotal + tax + fee;

  // Processar produtos (até 10 produtos por pedido)
  for (let p = 1; p <= 10; p++) {
    const skuIdx = headers.findIndex(h => h === `SKU #${p}`);
    const productNameIdx = headers.findIndex(h => h === `Product Name #${p}`);
    const productIdIdx = headers.findIndex(h => h === `Product Id #${p}`);

    if (skuIdx === -1) continue;

    const sku = values[skuIdx] || '';
    const productName = values[productNameIdx] || '';
    const productId = values[productIdIdx] || '';

    // Se não tem produto, pular
    if (!productName && !sku) continue;

    totalProducts++;

    // Criar linha de saída
    const outputLine = [
      customerId + '-' + (totalOrders % 10000), // Número do Pedido
      email,
      new Date().toLocaleDateString('pt-BR'), // Data (hoje, pois não temos no CSV)
      'Concluído', // Status do Pedido
      'Confirmado', // Status do Pagamento
      'Enviado', // Status do Envio
      'BRL', // Moeda
      orderSubtotal, // Subtotal
      '0', // Desconto
      orderFee, // Valor do Frete
      total.toFixed(2).replace('.', ','), // Total
      firstName, // Nome do comprador
      '', // CPF / CNPJ
      phone, // Telefone
      firstName, // Nome para a entrega
      phone, // Telefone para a entrega
      address || shippingAddress, // Endereço
      '', // Número
      '', // Complemento
      '', // Bairro
      city, // Cidade
      postcode, // Código postal
      '', // Estado
      'Brasil', // País
      'Correios', // Forma de Entrega
      paymentMethod, // Forma de Pagamento
      '', // Cupom de Desconto
      '', // Anotações do Comprador
      '', // Anotações do Vendedor
      new Date().toLocaleDateString('pt-BR'), // Data de pagamento
      new Date().toLocaleDateString('pt-BR'), // Data de envio
      productName, // Nome do Produto
      (total / p).toFixed(2).replace('.', ','), // Valor do Produto (estimado)
      '1', // Quantidade Comprada
      sku, // SKU
      'WordPress', // Canal
      '', // Código de rastreio
      customerId, // Identificador da transação
      customerId + '-' + (totalOrders % 10000), // Identificador do pedido
      'Sim', // Produto Físico
      '', // Pessoa que registrou
      'WordPress', // Local de venda
      '', // Vendedor
      '', // Data de cancelamento
      '' // Motivo de cancelamento
    ];

    outputLines.push(outputLine.map(v => `"${v}"`).join(';'));
  }

  if (i % 1000 === 0) {
    console.log(`Processados ${i}/${lines.length} pedidos...`);
  }
}

// Escrever arquivo de saída
fs.writeFileSync(outputFile, outputLines.join('\n'), 'utf8');

console.log('\n✅ Conversão concluída!');
console.log(`Total de pedidos processados: ${totalOrders}`);
console.log(`Total de linhas de produtos geradas: ${totalProducts}`);
console.log(`Arquivo gerado: ${outputFile}`);
