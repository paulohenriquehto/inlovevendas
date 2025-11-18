import { Venda, DashboardMetrics } from './types';

// Parser CSV manual - sem dependências externas
function parseCSVLine(line: string, delimiter: string = ';'): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Lista de plataformas disponíveis
export const PLATAFORMAS = ['nuvem-shopping', 'wordpress', 'sistema-novo'] as const;
export type Plataforma = typeof PLATAFORMAS[number];

// Mapear nome da plataforma para nome de exibição
export const PLATAFORMA_LABELS: Record<Plataforma, string> = {
  'nuvem-shopping': 'Nuvem Shopping',
  'wordpress': 'WordPress',
  'sistema-novo': 'Sistema Novo',
};

export async function loadCSVData(plataforma?: Plataforma): Promise<Venda[]> {
  try {
    // Se não especificar plataforma, usar 'nuvem-shopping' por padrão (compatibilidade)
    const plataformaName = plataforma || 'nuvem-shopping';
    const csvPath = `/vendas-${plataformaName}.csv`;

    const response = await fetch(csvPath);
    if (!response.ok) {
      console.error(`Erro ao carregar CSV da plataforma ${plataformaName}:`, response.status);
      return [];
    }

    // Ler como array buffer e decodificar com ISO-8859-1
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('ISO-8859-1');
    const csvText = decoder.decode(buffer);

    // Processar linhas respeitando quebras dentro de aspas
    const rawLines = csvText.split('\n');
    const lines: string[] = [];
    let currentLine = '';
    let inQuotes = false;

    for (const rawLine of rawLines) {
      if (!rawLine.trim() && !inQuotes) continue;

      // Contar aspas para saber se estamos dentro de um campo com aspas
      for (const char of rawLine) {
        if (char === '"') inQuotes = !inQuotes;
      }

      if (currentLine) {
        currentLine += '\n' + rawLine;
      } else {
        currentLine = rawLine;
      }

      // Se não estamos dentro de aspas, a linha está completa
      if (!inQuotes) {
        if (currentLine.trim()) {
          lines.push(currentLine);
        }
        currentLine = '';
      }
    }

    // Adicionar última linha se houver
    if (currentLine.trim()) {
      lines.push(currentLine);
    }

    if (lines.length === 0) {
      console.error('CSV vazio');
      return [];
    }

    // Primeira linha = headers
    const headers = parseCSVLine(lines[0]);
    console.log('Headers encontrados:', headers.length);
    console.log('Total de linhas:', lines.length);

    // Mapeamento de índices das colunas
    const getIndex = (name: string) => headers.findIndex(h =>
      h.toLowerCase().includes(name.toLowerCase())
    );

    const vendas: Venda[] = [];

    // Processar cada linha
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      const parseNumber = (val: string): number => {
        if (!val) return 0;
        const cleaned = val.replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      };

      const venda: Venda = {
        numeroPedido: values[0] || '',
        email: values[1] || '',
        data: values[2] || '',
        statusPedido: values[3] || '',
        statusPagamento: values[4] || '',
        statusEnvio: values[5] || '',
        moeda: values[6] || '',
        subtotal: parseNumber(values[7]),
        desconto: parseNumber(values[8]),
        valorFrete: parseNumber(values[9]),
        total: parseNumber(values[10]),
        nomeComprador: values[11] || '',
        cpfCnpj: values[12] || '',
        telefone: values[13] || '',
        nomeEntrega: values[14] || '',
        telefoneEntrega: values[15] || '',
        endereco: values[16] || '',
        numero: values[17] || '',
        complemento: values[18] || '',
        bairro: values[19] || '',
        cidade: values[20] || '',
        codigoPostal: values[21] || '',
        estado: values[22] || '',
        pais: values[23] || '',
        formaEntrega: values[24] || '',
        formaPagamento: values[25] || '',
        cupomDesconto: values[26] || '',
        anotacoesComprador: values[27] || '',
        anotacoesVendedor: values[28] || '',
        dataPagamento: values[29] || '',
        dataEnvio: values[30] || '',
        nomeProduto: values[31] || '',
        valorProduto: parseNumber(values[32]),
        quantidadeComprada: parseNumber(values[33]),
        sku: values[34] || '',
        canal: values[35] || '',
        plataforma: PLATAFORMA_LABELS[plataformaName],
        codigoRastreio: values[36] || '',
        identificadorTransacao: values[37] || '',
        identificadorPedido: values[38] || '',
        produtoFisico: values[39] || '',
        pessoaRegistrou: values[40] || '',
        localVenda: values[41] || '',
        vendedor: values[42] || '',
        dataCancelamento: values[43] || '',
        motivoCancelamento: values[44] || '',
      };

      // Só adicionar se tiver número do pedido
      if (venda.numeroPedido) {
        vendas.push(venda);
      }
    }

    console.log(`Total de vendas carregadas da plataforma ${plataformaName}:`, vendas.length);
    return vendas;

  } catch (error) {
    console.error(`Erro ao processar CSV da plataforma ${plataforma}:`, error);
    return [];
  }
}

// Carregar dados de todas as plataformas
export async function loadAllPlatformsData(): Promise<Venda[]> {
  try {
    const allVendas: Venda[] = [];

    // Carregar dados de cada plataforma
    for (const plataforma of PLATAFORMAS) {
      const vendasPlataforma = await loadCSVData(plataforma);
      allVendas.push(...vendasPlataforma);
    }

    console.log('Total de vendas carregadas (todas as plataformas):', allVendas.length);

    // Enriquecer com métricas do cliente
    const vendasEnriquecidas = enrichWithClientMetrics(allVendas);
    return vendasEnriquecidas;
  } catch (error) {
    console.error('Erro ao carregar dados de todas as plataformas:', error);
    return [];
  }
}

// Enriquecer vendas com métricas do cliente
export function enrichWithClientMetrics(vendas: Venda[]): Venda[] {
  // Agrupar pedidos por cliente (usar email ou CPF como identificador)
  const clientePedidos = new Map<string, Set<string>>();

  vendas.forEach(venda => {
    // Usar email como identificador principal, CPF como alternativa
    const clienteId = venda.email || venda.cpfCnpj || 'desconhecido';

    if (!clientePedidos.has(clienteId)) {
      clientePedidos.set(clienteId, new Set());
    }

    // Adicionar número do pedido ao conjunto (Set elimina duplicatas)
    if (venda.numeroPedido) {
      clientePedidos.get(clienteId)!.add(venda.numeroPedido);
    }
  });

  // Enriquecer cada venda com métricas do cliente
  return vendas.map(venda => {
    const clienteId = venda.email || venda.cpfCnpj || 'desconhecido';
    const totalPedidos = clientePedidos.get(clienteId)?.size || 0;

    return {
      ...venda,
      totalPedidosCliente: totalPedidos,
      primeiraCompraCliente: totalPedidos === 1,
    };
  });
}

export function calculateMetrics(vendas: Venda[]): DashboardMetrics {
  console.log('Calculando métricas para', vendas.length, 'vendas');

  // Agrupar vendas por pedido (cada pedido pode ter múltiplos produtos)
  const pedidosMap = new Map<string, Venda[]>();

  vendas.forEach(venda => {
    if (!venda.numeroPedido) return;

    if (!pedidosMap.has(venda.numeroPedido)) {
      pedidosMap.set(venda.numeroPedido, []);
    }
    pedidosMap.get(venda.numeroPedido)!.push(venda);
  });

  // Calcular totais
  const totalPedidos = pedidosMap.size;
  let receitaTotal = 0;
  const pedidosUnicos = new Set<string>();

  // Calcular receita total usando o campo 'total' do primeiro item de cada pedido
  pedidosMap.forEach((itens, numeroPedido) => {
    if (itens.length > 0) {
      receitaTotal += itens[0].total || 0;
      pedidosUnicos.add(numeroPedido);
    }
  });

  const totalVendas = vendas.filter(v => v.nomeProduto).length;
  const ticketMedio = totalPedidos > 0 ? receitaTotal / totalPedidos : 0;

  // Pedidos por status de pagamento
  const statusMap = new Map<string, number>();
  pedidosMap.forEach((itens) => {
    const status = itens[0].statusPagamento || 'Não informado';
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });
  const pedidosPorStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count
  }));

  // Vendas por dia
  const vendasPorDiaMap = new Map<string, { total: number; quantidade: number }>();
  pedidosMap.forEach((itens) => {
    const dataStr = itens[0].data;
    if (!dataStr) return;

    // Extrair apenas a data (sem hora)
    const data = dataStr.split(' ')[0];

    if (!vendasPorDiaMap.has(data)) {
      vendasPorDiaMap.set(data, { total: 0, quantidade: 0 });
    }

    const current = vendasPorDiaMap.get(data)!;
    current.total += itens[0].total || 0;
    current.quantidade += 1;
  });
  const vendasPorDia = Array.from(vendasPorDiaMap.entries())
    .map(([data, values]) => ({
      data,
      total: values.total,
      quantidade: values.quantidade
    }))
    .sort((a, b) => {
      const [diaA, mesA, anoA] = a.data.split('/');
      const [diaB, mesB, anoB] = b.data.split('/');
      const dateA = new Date(parseInt(anoA), parseInt(mesA) - 1, parseInt(diaA));
      const dateB = new Date(parseInt(anoB), parseInt(mesB) - 1, parseInt(diaB));
      return dateA.getTime() - dateB.getTime();
    });

  // Produtos mais vendidos
  const produtosMap = new Map<string, { quantidade: number; receita: number }>();
  vendas.forEach(venda => {
    if (!venda.nomeProduto) return;

    const produto = venda.nomeProduto;
    if (!produtosMap.has(produto)) {
      produtosMap.set(produto, { quantidade: 0, receita: 0 });
    }

    const current = produtosMap.get(produto)!;
    current.quantidade += venda.quantidadeComprada || 0;
    current.receita += (venda.valorProduto || 0) * (venda.quantidadeComprada || 0);
  });
  const produtosMaisVendidos = Array.from(produtosMap.entries())
    .map(([produto, values]) => ({
      produto,
      quantidade: values.quantidade,
      receita: values.receita
    }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10);

  // Vendas por estado
  const estadosMap = new Map<string, { quantidade: number; receita: number }>();
  pedidosMap.forEach((itens) => {
    const estado = itens[0].estado || 'Não informado';

    if (!estadosMap.has(estado)) {
      estadosMap.set(estado, { quantidade: 0, receita: 0 });
    }

    const current = estadosMap.get(estado)!;
    current.quantidade += 1;
    current.receita += itens[0].total || 0;
  });
  const vendasPorEstado = Array.from(estadosMap.entries())
    .map(([estado, values]) => ({
      estado,
      quantidade: values.quantidade,
      receita: values.receita
    }))
    .sort((a, b) => b.receita - a.receita);

  // Vendas por canal
  const canaisMap = new Map<string, { quantidade: number; receita: number }>();
  pedidosMap.forEach((itens) => {
    const canal = itens[0].canal || 'Não informado';

    if (!canaisMap.has(canal)) {
      canaisMap.set(canal, { quantidade: 0, receita: 0 });
    }

    const current = canaisMap.get(canal)!;
    current.quantidade += 1;
    current.receita += itens[0].total || 0;
  });
  const vendasPorCanal = Array.from(canaisMap.entries())
    .map(([canal, values]) => ({
      canal,
      quantidade: values.quantidade,
      receita: values.receita
    }))
    .sort((a, b) => b.quantidade - a.quantidade);

  // Formas de pagamento
  const formasPagamentoMap = new Map<string, number>();
  pedidosMap.forEach((itens) => {
    const forma = itens[0].formaPagamento || 'Não informado';
    formasPagamentoMap.set(forma, (formasPagamentoMap.get(forma) || 0) + 1);
  });
  const formasPagamento = Array.from(formasPagamentoMap.entries())
    .map(([forma, quantidade]) => ({
      forma,
      quantidade
    }))
    .sort((a, b) => b.quantidade - a.quantidade);

  // Vendas por plataforma
  const plataformasMap = new Map<string, { quantidade: number; receita: number }>();
  pedidosMap.forEach((itens) => {
    const plataforma = itens[0].plataforma || 'Não informado';

    if (!plataformasMap.has(plataforma)) {
      plataformasMap.set(plataforma, { quantidade: 0, receita: 0 });
    }

    const current = plataformasMap.get(plataforma)!;
    current.quantidade += 1;
    current.receita += itens[0].total || 0;
  });
  const vendasPorPlataforma = Array.from(plataformasMap.entries())
    .map(([plataforma, values]) => ({
      plataforma,
      quantidade: values.quantidade,
      receita: values.receita
    }))
    .sort((a, b) => b.quantidade - a.quantidade);

  // ========== NOVAS MÉTRICAS DE CLIENTES ==========

  // Análise de Clientes
  const clientesMap = new Map<string, { pedidos: Set<string>; total: number; nome: string; cpf: string }>();

  vendas.forEach(venda => {
    const clienteId = venda.email || venda.cpfCnpj || 'desconhecido';
    if (!clientesMap.has(clienteId)) {
      clientesMap.set(clienteId, {
        pedidos: new Set(),
        total: 0,
        nome: venda.nomeComprador || 'Não informado',
        cpf: venda.cpfCnpj || '',
      });
    }
    const cliente = clientesMap.get(clienteId)!;

    // Adicionar pedido único
    if (venda.numeroPedido && !cliente.pedidos.has(venda.numeroPedido)) {
      cliente.pedidos.add(venda.numeroPedido);
      // Adicionar o total do pedido apenas uma vez
      cliente.total += venda.total || 0;
    }
  });

  const totalClientes = clientesMap.size;
  const clientesNovos = Array.from(clientesMap.values())
    .filter(c => c.pedidos.size === 1).length;
  const clientesRecorrentes = totalClientes - clientesNovos;
  const taxaRecompra = totalClientes > 0 ? (clientesRecorrentes / totalClientes) * 100 : 0;
  const ticketMedioPorCliente = totalClientes > 0 ? receitaTotal / totalClientes : 0;

  // Top 10 Clientes
  const topClientes = Array.from(clientesMap.entries())
    .map(([email, data]) => ({
      email,
      nome: data.nome,
      cpf: data.cpf,
      totalPedidos: data.pedidos.size,
      totalGasto: data.total,
    }))
    .sort((a, b) => b.totalPedidos - a.totalPedidos)
    .slice(0, 10);

  // Distribuição de Clientes por Frequência
  const distribuicao = [
    { categoria: '1 pedido', min: 1, max: 1 },
    { categoria: '2-3 pedidos', min: 2, max: 3 },
    { categoria: '4-5 pedidos', min: 4, max: 5 },
    { categoria: '6+ pedidos', min: 6, max: 999 },
  ];

  const distribuicaoClientes = distribuicao.map(({ categoria, min, max }) => {
    const quantidade = Array.from(clientesMap.values())
      .filter(c => c.pedidos.size >= min && c.pedidos.size <= max).length;
    return {
      categoria,
      quantidade,
      percentual: totalClientes > 0 ? (quantidade / totalClientes) * 100 : 0,
    };
  });

  // Análise de Cupons
  const cuponsMap = new Map<string, { usos: number; descontoTotal: number; receitaGerada: number }>();

  pedidosMap.forEach((itens) => {
    const cupom = itens[0].cupomDesconto || 'Sem cupom';
    if (cupom !== 'Sem cupom' && cupom) {
      if (!cuponsMap.has(cupom)) {
        cuponsMap.set(cupom, { usos: 0, descontoTotal: 0, receitaGerada: 0 });
      }
      const current = cuponsMap.get(cupom)!;
      current.usos += 1;
      current.descontoTotal += itens[0].desconto || 0;
      current.receitaGerada += itens[0].total || 0;
    }
  });

  const usoCupons = Array.from(cuponsMap.entries())
    .map(([cupom, values]) => ({
      cupom,
      usos: values.usos,
      descontoTotal: values.descontoTotal,
      receitaGerada: values.receitaGerada,
    }))
    .sort((a, b) => b.usos - a.usos);

  // Tempo médio de pagamento (opcional - calcular se houver dados)
  let tempoMedioPagamento: number | undefined = undefined;
  let totalDiasPagamento = 0;
  let contagemPagamentos = 0;

  pedidosMap.forEach((itens) => {
    const venda = itens[0];
    if (venda.data && venda.dataPagamento) {
      try {
        const [dia1, mes1, ano1] = venda.data.split(' ')[0].split('/');
        const [dia2, mes2, ano2] = venda.dataPagamento.split(' ')[0].split('/');
        const dataPedido = new Date(parseInt(ano1), parseInt(mes1) - 1, parseInt(dia1));
        const dataPgto = new Date(parseInt(ano2), parseInt(mes2) - 1, parseInt(dia2));
        const diffTime = dataPgto.getTime() - dataPedido.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        if (diffDays >= 0) {
          totalDiasPagamento += diffDays;
          contagemPagamentos += 1;
        }
      } catch (e) {
        // Ignorar erros de parsing de data
      }
    }
  });

  if (contagemPagamentos > 0) {
    tempoMedioPagamento = totalDiasPagamento / contagemPagamentos;
  }

  const metrics = {
    totalVendas,
    receitaTotal,
    ticketMedio,
    totalPedidos,
    pedidosPorStatus,
    vendasPorDia,
    produtosMaisVendidos,
    vendasPorEstado,
    vendasPorCanal,
    formasPagamento,
    vendasPorPlataforma,

    // Novas métricas de clientes
    totalClientes,
    clientesNovos,
    clientesRecorrentes,
    taxaRecompra,
    ticketMedioPorCliente,
    tempoMedioPagamento,
    topClientes,
    distribuicaoClientes,
    usoCupons,
  };

  console.log('Métricas calculadas:', metrics);
  return metrics;
}
