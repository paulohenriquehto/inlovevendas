import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import Papa from 'papaparse';
import { Venda } from '@/lib/types';
import { unstable_cache } from 'next/cache';

// Converter data serial do Excel para formato legível
function excelDateToJSDate(serial: number): string {
  if (!serial || isNaN(serial)) return '';
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);

  const year = date_info.getUTCFullYear();
  const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date_info.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Normalizar forma de pagamento
function normalizePaymentMethod(method: string): string {
  if (!method) return 'Não informado';

  const methodMap: { [key: string]: string } = {
    'cod': 'Pagamento na entrega',
    'bacs': 'Transferência bancária',
    'pix': 'PIX',
    'credit-card': 'Cartão de crédito',
    'debit-card': 'Cartão de débito',
  };

  return methodMap[method.toLowerCase()] || method;
}

// Normalizar status do pedido
function normalizeOrderStatus(status: string): string {
  if (!status) return 'Desconhecido';

  const statusMap: { [key: string]: string } = {
    'processing': 'Processando',
    'completed': 'Completo',
    'pending': 'Pendente',
    'cancelled': 'Cancelado',
    'refunded': 'Reembolsado',
    'failed': 'Falhou',
    'on-hold': 'Em espera',
  };

  return statusMap[status.toLowerCase()] || status;
}

// Função que processa os dados WordPress (será cacheada)
async function processWordPressData(): Promise<Venda[]> {
  const path = await import('path');
  const basePath = process.cwd();

  // 1. Ler arquivo XLSX
  const xlsxPath = path.join(basePath, 'wordpess', 'vendas12.xlsx');
  console.log(`[WordPress API] Tentando ler: ${xlsxPath}`);
  console.log(`[WordPress API] Arquivo existe?`, fs.existsSync(xlsxPath));

  if (!fs.existsSync(xlsxPath)) {
    throw new Error(`Arquivo não encontrado: ${xlsxPath}`);
  }

  const xlsxBuffer = fs.readFileSync(xlsxPath);
  const workbook = XLSX.read(xlsxBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const xlsxData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];

  console.log(`[WordPress API] XLSX carregado: ${xlsxData.length} linhas`);

  // 2. Ler arquivo CSV
  const csvPath = path.join(basePath, 'wordpess', 'vendas word.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvResult = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
  const csvData = csvResult.data as any[];

  console.log(`[WordPress API] CSV carregado: ${csvData.length} linhas`);

  // 3. Agrupar XLSX por pedido
  const orderGroups: { [orderNumber: string]: any[] } = {};
  xlsxData.forEach(row => {
    const orderNum = String(row['Order Number'] || '').trim();
    if (!orderNum) return;

    if (!orderGroups[orderNum]) {
      orderGroups[orderNum] = [];
    }
    orderGroups[orderNum].push(row);
  });

  console.log(`[WordPress API] Total de pedidos únicos: ${Object.keys(orderGroups).length}`);

  // 4. Criar mapa de CSV por email e valor (para matching)
  const csvMap = new Map<string, any>();
  csvData.forEach(row => {
    const email = (row['Email (Billing)'] || '').toLowerCase().trim();
    const subtotal = String(row['Order Subtotal Amount'] || '').trim();
    const key = `${email}|${subtotal}`;
    csvMap.set(key, row);
  });

  // 5. Processar cada pedido
  const vendas: Venda[] = [];

  Object.entries(orderGroups).forEach(([orderNumber, items]) => {
    // Usar primeira linha como base (dados do pedido são iguais em todas as linhas)
    const firstItem = items[0];

    const email = (firstItem['Email (Billing)'] || '').toLowerCase().trim();
    const subtotal = String(firstItem['Order Subtotal Amount'] || '').trim();
    const matchKey = `${email}|${subtotal}`;
    const csvRow = csvMap.get(matchKey);

    const orderDate = excelDateToJSDate(firstItem['Order Date']);
    const orderStatus = normalizeOrderStatus(firstItem['Order Status'] || '');

    // Processar cada item do pedido
    items.forEach(item => {
      const venda: Venda = {
        numeroPedido: orderNumber,
        email: firstItem['Email (Billing)'] || '',
        data: orderDate,
        statusPedido: orderStatus,
        statusPagamento: orderStatus === 'Completo' ? 'Confirmado' : orderStatus === 'Cancelado' ? 'Recusado' : 'Pendente',
        statusEnvio: orderStatus === 'Completo' ? 'Enviado' : 'Pendente',
        moeda: 'BRL',
        subtotal: parseFloat(String(firstItem['Order Subtotal Amount'] || 0)),
        desconto: parseFloat(String(firstItem['Cart Discount Amount'] || 0)),
        valorFrete: parseFloat(String(firstItem['Order Shipping Amount'] || 0)),
        total: parseFloat(String(firstItem['Order Total Amount'] || 0)),
        nomeComprador: `${firstItem['First Name (Billing)']} ${firstItem['Last Name (Billing)']}`.trim(),
        cpfCnpj: '',
        telefone: firstItem['Phone (Billing)'] || '',
        nomeEntrega: `${firstItem['First Name (Shipping)']} ${firstItem['Last Name (Shipping)']}`.trim(),
        telefoneEntrega: firstItem['Phone (Billing)'] || '',
        endereco: firstItem['Address 1&2 (Billing)'] || '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: firstItem['City (Billing)'] || '',
        codigoPostal: firstItem['Postcode (Billing)'] || '',
        estado: firstItem['State Code (Billing)'] || '',
        pais: firstItem['Country Code (Billing)'] || 'BR',
        formaEntrega: firstItem['Shipping Method Title'] || 'Não informado',
        formaPagamento: normalizePaymentMethod(csvRow ? csvRow['Payment Method'] : firstItem['Payment Method Title'] || ''),
        cupomDesconto: '',
        anotacoesComprador: '',
        anotacoesVendedor: '',
        dataPagamento: orderStatus === 'Completo' ? orderDate : '',
        dataEnvio: orderStatus === 'Completo' ? orderDate : '',
        nomeProduto: item['Item Name'] || '',
        valorProduto: parseFloat(String(item['Item Cost'] || 0)),
        quantidadeComprada: parseInt(String(item['Quantity (- Refund)'] || 0)),
        sku: item['SKU'] || '',
        canal: 'Loja Virtual',
        plataforma: 'WordPress',
        codigoRastreio: '',
        identificadorTransacao: '',
        identificadorPedido: orderNumber,
        produtoFisico: 'Sim',
        pessoaRegistrou: '',
        localVenda: firstItem['City (Billing)'] || '',
        vendedor: '',
        dataCancelamento: orderStatus === 'Cancelado' ? orderDate : '',
        motivoCancelamento: orderStatus === 'Cancelado' ? 'Cancelado' : '',

        // Dados do cliente (do CSV se disponível)
        totalPedidosCliente: csvRow ? parseInt(String(csvRow['Customer Paid Orders'] || 0)) : undefined,
      };

      vendas.push(venda);
    });
  });

  console.log(`[WordPress API] Total de vendas processadas: ${vendas.length}`);

  return vendas;
}

// Versão cacheada da função (cache por 5 minutos)
const getCachedWordPressData = unstable_cache(
  async () => processWordPressData(),
  ['wordpress-vendas'],
  {
    revalidate: 300, // 5 minutos
    tags: ['wordpress-data']
  }
);

export async function GET() {
  try {
    console.log('[WordPress API] Buscando dados (com cache)...');
    const vendas = await getCachedWordPressData();

    return NextResponse.json({ vendas });
  } catch (error) {
    console.error('Erro ao processar dados do WordPress:', error);
    return NextResponse.json(
      { error: 'Erro ao processar dados do WordPress', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
