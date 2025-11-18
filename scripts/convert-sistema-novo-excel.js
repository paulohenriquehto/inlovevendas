const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const inputFile = path.join(__dirname, '..', '..', 'Sistema-novo', 'relatorio-pedidos-completo-2025-11-17.xlsx');
const outputFile = path.join(__dirname, '..', 'public', 'vendas-sistema-novo.csv');

function parseCurrency(str) {
  if (!str || typeof str !== 'string') return 0;
  const s = str.replace(/[^0-9.,-]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

function clean(val) {
  if (val === undefined || val === null) return '';
  return String(val).trim();
}

function loadWorkbook() {
  if (!fs.existsSync(inputFile)) throw new Error('Arquivo de entrada não encontrado');
  return XLSX.readFile(inputFile);
}

function getSheet(workbook, nameContains) {
  const name = workbook.SheetNames.find(n => n.toLowerCase().includes(nameContains)) || workbook.SheetNames[0];
  return workbook.Sheets[name];
}

function sheetToRows(ws) {
  return XLSX.utils.sheet_to_json(ws, { header: 1 });
}

function buildOutputHeaders() {
  return [
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
}

function indexHeaders(headers) {
  const idx = new Map();
  headers.forEach((h, i) => idx.set(String(h).trim().toLowerCase(), i));
  return idx;
}

function main() {
  console.log('🔄 Conversão Sistema Novo Excel');
  console.log('Input:', inputFile);
  console.log('Output:', outputFile);

  const workbook = loadWorkbook();
  const pedidosWS = getSheet(workbook, 'pedido');
  const itensWS = getSheet(workbook, 'item');

  const pedidosRows = sheetToRows(pedidosWS);
  const itensRows = sheetToRows(itensWS);

  if (!pedidosRows.length || !itensRows.length) {
    console.error('Planilhas vazias');
    process.exit(1);
  }

  const pedidosHeaders = pedidosRows[0];
  const itensHeaders = itensRows[0];
  const idxP = indexHeaders(pedidosHeaders);
  const idxI = indexHeaders(itensHeaders);

  const outHeaders = buildOutputHeaders();
  const outLines = [outHeaders.map(h => `"${h}"`).join(';')];

  const getP = (row, name) => {
    const k = name.toLowerCase();
    const i = idxP.get(k);
    return i !== undefined ? row[i] : '';
  };
  const getI = (row, name) => {
    const k = name.toLowerCase();
    const i = idxI.get(k);
    return i !== undefined ? row[i] : '';
  };

  const pedidosMap = new Map();
  for (let r = 1; r < pedidosRows.length; r++) {
    const row = pedidosRows[r];
    const numero = clean(getP(row, 'Número do Pedido')) || clean(row[0]);
    if (!numero) continue;
    pedidosMap.set(numero, {
      numero,
      email: clean(getP(row, 'Email')),
      data: clean(getP(row, 'Data/Hora')),
      status: clean(getP(row, 'Status')),
      metodoPagamento: clean(getP(row, 'Método de Pagamento')),
      metodoEntrega: clean(getP(row, 'Método de Entrega')),
      subtotal: parseCurrency(clean(getP(row, 'Subtotal'))),
      desconto: parseCurrency(clean(getP(row, 'Desconto'))),
      total: parseCurrency(clean(getP(row, 'Total Final'))),
      cliente: clean(getP(row, 'Cliente')),
      cpf: clean(getP(row, 'CPF')),
      telefone: clean(getP(row, 'Telefone')),
      enderecoEntrega: clean(getP(row, 'Endereço de Entrega')),
      observacoes: clean(getP(row, 'Observações')),
      criadoEm: clean(getP(row, 'Criado em')),
      atualizadoEm: clean(getP(row, 'Atualizado em')),
    });
  }

  for (let r = 1; r < itensRows.length; r++) {
    const row = itensRows[r];
    const numero = clean(getI(row, 'Número do Pedido')) || clean(row[0]);
    if (!numero) continue;
    const pedido = pedidosMap.get(numero) || {
      numero,
      email: '',
      data: '',
      status: '',
      metodoPagamento: '',
      metodoEntrega: '',
      subtotal: 0,
      desconto: 0,
      total: 0,
      cliente: '',
      cpf: '',
      telefone: '',
      enderecoEntrega: '',
      observacoes: '',
      criadoEm: '',
      atualizadoEm: '',
    };

    const nomeProduto = clean(getI(row, 'Produto'));
    const precoUnitario = parseCurrency(clean(getI(row, 'Preço Unitário')));
    const quantidade = parseFloat(clean(getI(row, 'Quantidade'))) || 0;
    const skuProduto = clean(getI(row, 'SKU Variante')) || clean(getI(row, 'SKU Produto'));
    const observacoesVenda = clean(getI(row, 'Observações Venda'));
    const textoGravacao = clean(getI(row, 'Texto Gravação'));
    const fonteGravacao = clean(getI(row, 'Fonte Gravação'));
    const simbolosGravacao = clean(getI(row, 'Símbolos Gravação'));

    const anotacoesComprador = [observacoesVenda, textoGravacao, fonteGravacao, simbolosGravacao]
      .filter(Boolean)
      .join(' | ');

    const line = [
      pedido.numero,
      pedido.email,
      pedido.data,
      pedido.status,
      pedido.status,
      '',
      'BRL',
      pedido.subtotal.toFixed(2).replace('.', ','),
      pedido.desconto.toFixed(2).replace('.', ','),
      (0).toFixed(2).replace('.', ','),
      pedido.total.toFixed(2).replace('.', ','),
      pedido.cliente,
      pedido.cpf,
      pedido.telefone,
      pedido.cliente,
      pedido.telefone,
      pedido.enderecoEntrega,
      '',
      '',
      '',
      '',
      '',
      '',
      'Brasil',
      pedido.metodoEntrega,
      pedido.metodoPagamento,
      '',
      pedido.observacoes || anotacoesComprador,
      '',
      pedido.criadoEm,
      pedido.atualizadoEm,
      nomeProduto,
      precoUnitario.toFixed(2).replace('.', ','),
      quantidade.toString(),
      skuProduto,
      'Sistema Novo',
      '',
      '',
      pedido.numero,
      'Sim',
      '',
      'Sistema Novo',
      '',
      '',
      ''
    ];

    outLines.push(line.map(v => `"${v}"`).join(';'));
  }

  fs.writeFileSync(outputFile, outLines.join('\n'), 'utf8');
  console.log('✅ Conversão concluída');
  console.log('Linhas geradas:', outLines.length - 1);
  console.log('Arquivo salvo:', outputFile);
}

main();

