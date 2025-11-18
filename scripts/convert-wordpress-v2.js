const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '..', '..', 'wordpess', 'vendas word.csv');
const outputFile = path.join(__dirname, '..', 'public', 'vendas-wordpress.csv');

console.log('🔄 Conversão WordPress v2 - Foco em dados de PEDIDOS');
console.log('Input:', inputFile);
console.log('Output:', outputFile);

const content = fs.readFileSync(inputFile, 'latin1');
const lines = content.split('\n').filter(line => line.trim());

console.log(`Total de linhas: ${lines.length}`);

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
  return result.map(v => v.replace(/^"|"$/g, '').trim());
}

const headerLine = lines[0];
const headers = parseCSVLine(headerLine);
console.log('Headers:', headers.length);

// Headers de saída
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

const outputLines = [];
outputLines.push(outputHeaders.map(h => `"${h}"`).join(';'));

let totalPedidos = 0;
let totalLinhas = 0;

// Processar cada pedido
for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);
  if (values.length < 5) continue;

  const customerId = values[0] || '';
  const customerUsername = values[1] || '';
  const customerTotalOrders = values[2] || '1';
  const customerPaidOrders = values[3] || '1';
  const customerTotalSpent = values[4] || '0';
  const firstName = values[5] || 'Cliente';
  const city = values[6] || '';
  const postcode = values[7] || '';
  const orderTax = values[8] || '0';
  const phone = values[9] || '';
  const orderFee = values[10] || '0';
  const email = values[11] || '';
  const orderSubtotal = values[12] || '0';
  const fullAddress = values[13] || '';
  const paymentMethod = values[14] || '';

  // Calcular total
  const subtotal = parseFloat(orderSubtotal.replace(',', '.')) || 0;
  const tax = parseFloat(orderTax.replace(',', '.')) || 0;
  const fee = parseFloat(orderFee.replace(',', '.')) || 0;
  const total = subtotal + tax + fee;

  // Se não tem dados mínimos, pular
  if (!email && !customerId) continue;

  totalPedidos++;

  // Verificar se tem produtos nas colunas 15-44 (SKU #1-10, Product Name #1-10, etc)
  let hasProducts = false;
  let productCount = 0;

  for (let p = 1; p <= 10; p++) {
    const skuIdx = 15 + (p - 1) * 3; // SKU #1 = col 15, SKU #2 = col 18, etc
    const productNameIdx = skuIdx + 1;
    const productIdIdx = skuIdx + 2;

    const sku = values[skuIdx] || '';
    const productName = values[productNameIdx] || '';
    const productId = values[productIdIdx] || '';

    if (productName || sku) {
      hasProducts = true;
      productCount++;

      totalLinhas++;

      const outputLine = [
        customerId || `WP-${i}`,
        email || `cliente${i}@wordpress.com`,
        '01/10/2022', // Data estimada (arquivo não tem)
        'Concluído',
        'Confirmado',
        'Enviado',
        'BRL',
        orderSubtotal,
        '0',
        orderFee,
        total.toFixed(2).replace('.', ','),
        firstName,
        '',
        phone,
        firstName,
        phone,
        fullAddress.replace(/\n/g, ' '),
        '',
        '',
        '',
        city,
        postcode,
        '',
        'Brasil',
        'Correios',
        paymentMethod,
        '',
        '',
        '',
        '01/10/2022',
        '01/10/2022',
        productName || 'Produto WordPress',
        (total / productCount).toFixed(2).replace('.', ','),
        '1',
        sku || `SKU-${productId}`,
        'WordPress',
        '',
        customerId,
        customerId || `WP-${i}`,
        'Sim',
        '',
        'WordPress',
        '',
        '',
        ''
      ];

      outputLines.push(outputLine.map(v => `"${v}"`).join(';'));
    }
  }

  // Se NÃO tem produtos, criar UMA linha genérica para o pedido
  if (!hasProducts && total > 0) {
    totalLinhas++;

    const outputLine = [
      customerId || `WP-${i}`,
      email || `cliente${i}@wordpress.com`,
      '01/10/2022',
      'Concluído',
      'Confirmado',
      'Enviado',
      'BRL',
      orderSubtotal,
      '0',
      orderFee,
      total.toFixed(2).replace('.', ','),
      firstName,
      '',
      phone,
      firstName,
      phone,
      fullAddress.replace(/\n/g, ' '),
      '',
      '',
      '',
      city,
      postcode,
      '',
      'Brasil',
      'Correios',
      paymentMethod,
      '',
      '',
      '',
      '01/10/2022',
      '01/10/2022',
      'Produto WordPress', // Produto genérico
      total.toFixed(2).replace('.', ','),
      '1',
      `WP-PROD-${i}`,
      'WordPress',
      '',
      customerId,
      customerId || `WP-${i}`,
      'Sim',
      '',
      'WordPress',
      '',
      '',
      ''
    ];

    outputLines.push(outputLine.map(v => `"${v}"`).join(';'));
  }

  if (i % 1000 === 0) {
    console.log(`Processados ${i}/${lines.length} pedidos...`);
  }
}

fs.writeFileSync(outputFile, outputLines.join('\n'), 'utf8');

console.log('\n✅ Conversão WordPress concluída!');
console.log(`📊 Total de pedidos processados: ${totalPedidos}`);
console.log(`📦 Total de linhas geradas: ${totalLinhas}`);
console.log(`💾 Arquivo: ${outputFile}`);
