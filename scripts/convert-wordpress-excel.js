const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Caminho dos arquivos
const inputFile = path.join(__dirname, '..', '..', 'wordpess', 'vendas12.xlsx');
const outputFile = path.join(__dirname, '..', 'public', 'vendas-wordpress.csv');

console.log('🔄 Conversão WordPress Excel - Processando vendas12.xlsx');
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
  console.log('Primeiros headers:', headers.slice(0, 10));
  
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
  
  // Array para armazenar linhas de saída
  const outputLines = [];
  outputLines.push(outputHeaders.map(h => `"${h}"`).join(';'));
  
  let totalPedidos = 0;
  let totalLinhas = 0;
  
  // Mapeamento de colunas comuns
  const getColumnIndex = (name) => {
    return headers.findIndex(h => 
      h && h.toString().toLowerCase().includes(name.toLowerCase())
    );
  };
  
  // Processar cada linha (pular header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    // Extrair dados básicos
    const numeroPedido = cleanValue(row[getColumnIndex('pedido')] || row[0] || `WP-${i}`);
    const email = cleanValue(row[getColumnIndex('email')] || row[getColumnIndex('e-mail')] || '');
    const dataPedido = cleanValue(row[getColumnIndex('data')] || '01/10/2022');
    const nomeComprador = cleanValue(row[getColumnIndex('nome')] || row[getColumnIndex('comprador')] || 'Cliente');
    const telefone = cleanValue(row[getColumnIndex('telefone')] || '');
    const cidade = cleanValue(row[getColumnIndex('cidade')] || '');
    const estado = cleanValue(row[getColumnIndex('estado')] || '');
    const cep = cleanValue(row[getColumnIndex('cep')] || row[getColumnIndex('postal')] || '');
    const endereco = cleanValue(row[getColumnIndex('endereço')] || row[getColumnIndex('address')] || '');
    const bairro = cleanValue(row[getColumnIndex('bairro')] || '');
    const numero = cleanValue(row[getColumnIndex('número')] || row[getColumnIndex('numero')] || '');
    const complemento = cleanValue(row[getColumnIndex('complemento')] || '');
    
    // Valores monetários
    const subtotal = parseNumber(row[getColumnIndex('subtotal')] || row[getColumnIndex('valor')] || '0');
    const desconto = parseNumber(row[getColumnIndex('desconto')] || '0');
    const frete = parseNumber(row[getColumnIndex('frete')] || row[getColumnIndex('envio')] || '0');
    const total = parseNumber(row[getColumnIndex('total')] || String(subtotal + frete - desconto));
    
    // Status e formas
    const statusPedido = cleanValue(row[getColumnIndex('status')] || 'Concluído');
    const statusPagamento = cleanValue(row[getColumnIndex('pagamento')] || 'Confirmado');
    const statusEnvio = cleanValue(row[getColumnIndex('envio')] || 'Enviado');
    const formaPagamento = cleanValue(row[getColumnIndex('pagamento método')] || row[getColumnIndex('payment')] || '');
    const formaEntrega = cleanValue(row[getColumnIndex('entrega')] || 'Correios');
    
    // Produto
    const nomeProduto = cleanValue(row[getColumnIndex('produto')] || row[getColumnIndex('product')] || 'Produto WordPress');
    const valorProduto = parseNumber(row[getColumnIndex('valor produto')] || String(total));
    const quantidade = parseNumber(row[getColumnIndex('quantidade')] || '1');
    const sku = cleanValue(row[getColumnIndex('sku')] || `WP-PROD-${i}`);
    const canal = cleanValue(row[getColumnIndex('canal')] || 'WordPress');
    
    // Datas
    const dataPagamento = cleanValue(row[getColumnIndex('pagamento data')] || dataPedido);
    const dataEnvio = cleanValue(row[getColumnIndex('envio data')] || dataPedido);
    
    // Dados adicionais
    const cpf = cleanValue(row[getColumnIndex('cpf')] || row[getColumnIndex('cnpj')] || '');
    const cupom = cleanValue(row[getColumnIndex('cupom')] || '');
    const codigoRastreio = cleanValue(row[getColumnIndex('rastreio')] || '');
    const anotacoesComprador = cleanValue(row[getColumnIndex('anotações')] || '');
    const anotacoesVendedor = cleanValue(row[getColumnIndex('vendedor anotações')] || '');
    
    // Se não tem email, tentar gerar um baseado no nome
    const emailFinal = email || (nomeComprador ? `${nomeComprador.toLowerCase().replace(/\s+/g, '.')}@wordpress.com` : `cliente${i}@wordpress.com`);
    
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
      nomeComprador, // Nome do comprador
      cpf, // CPF / CNPJ
      telefone, // Telefone
      nomeComprador, // Nome para a entrega
      telefone, // Telefone para a entrega
      endereco, // Endereço
      numero, // Número
      complemento, // Complemento
      bairro, // Bairro
      cidade, // Cidade
      cep, // Código postal
      estado, // Estado
      'Brasil', // País
      formaEntrega, // Forma de Entrega
      formaPagamento, // Forma de Pagamento
      cupom, // Cupom de Desconto
      anotacoesComprador, // Anotações do Comprador
      anotacoesVendedor, // Anotações do Vendedor
      dataPagamento, // Data de pagamento
      dataEnvio, // Data de envio
      nomeProduto, // Nome do Produto
      valorProduto.toFixed(2).replace('.', ','), // Valor do Produto
      quantidade.toString(), // Quantidade Comprada
      sku, // SKU
      canal, // Canal
      codigoRastreio, // Código de rastreio do envio
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
