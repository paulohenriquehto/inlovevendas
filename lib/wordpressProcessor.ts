import { Venda, DashboardMetrics } from './types';

export async function loadWordPressData(): Promise<Venda[]> {
  try {
    console.log('[WordPress] Buscando dados da API...');
    const response = await fetch('/api/wordpress/vendas');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Erro ao carregar dados do WordPress');
    }

    const data = await response.json();
    console.log('[WordPress] Dados carregados:', data.vendas.length, 'vendas');

    return data.vendas;
  } catch (error) {
    console.error('Erro ao carregar dados WordPress:', error);
    throw error;
  }
}

export function calculateWordPressMetrics(vendas: Venda[]): DashboardMetrics {
  // Agrupar por pedido (para não contar itens duplicados em totais)
  const pedidosUnicos = new Map<string, Venda[]>();
  vendas.forEach(venda => {
    if (!pedidosUnicos.has(venda.numeroPedido)) {
      pedidosUnicos.set(venda.numeroPedido, []);
    }
    pedidosUnicos.get(venda.numeroPedido)!.push(venda);
  });

  const totalPedidos = pedidosUnicos.size;
  let receitaTotal = 0;
  const pedidosPorStatus = new Map<string, number>();
  const vendasPorDiaMap = new Map<string, { total: number; quantidade: number }>();
  const produtosMap = new Map<string, { quantidade: number; receita: number }>();
  const estadosMap = new Map<string, { quantidade: number; receita: number }>();
  const canaisMap = new Map<string, { quantidade: number; receita: number }>();
  const formasPagamentoMap = new Map<string, number>();
  const clientesMap = new Map<string, { nome: string; totalPedidos: number; totalGasto: number }>();
  const cuponsMap = new Map<string, { usos: number; descontoTotal: number; receitaGerada: number }>();

  // Processar cada pedido
  pedidosUnicos.forEach((items, numeroPedido) => {
    const primeiroItem = items[0];
    const totalPedido = primeiroItem.total;

    receitaTotal += totalPedido;

    // Status
    const status = primeiroItem.statusPagamento;
    pedidosPorStatus.set(status, (pedidosPorStatus.get(status) || 0) + 1);

    // Vendas por dia
    const data = primeiroItem.data;
    if (data) {
      const existing = vendasPorDiaMap.get(data) || { total: 0, quantidade: 0 };
      vendasPorDiaMap.set(data, {
        total: existing.total + totalPedido,
        quantidade: existing.quantidade + 1
      });
    }

    // Estado
    const estado = primeiroItem.estado || 'Não informado';
    const estadoExisting = estadosMap.get(estado) || { quantidade: 0, receita: 0 };
    estadosMap.set(estado, {
      quantidade: estadoExisting.quantidade + 1,
      receita: estadoExisting.receita + totalPedido
    });

    // Canal
    const canal = primeiroItem.canal || 'Não informado';
    const canalExisting = canaisMap.get(canal) || { quantidade: 0, receita: 0 };
    canaisMap.set(canal, {
      quantidade: canalExisting.quantidade + 1,
      receita: canalExisting.receita + totalPedido
    });

    // Forma de pagamento
    const formaPagamento = primeiroItem.formaPagamento || 'Não informado';
    formasPagamentoMap.set(formaPagamento, (formasPagamentoMap.get(formaPagamento) || 0) + 1);

    // Clientes
    const email = primeiroItem.email.toLowerCase();
    const clienteExisting = clientesMap.get(email) || {
      nome: primeiroItem.nomeComprador,
      totalPedidos: 0,
      totalGasto: 0
    };
    clientesMap.set(email, {
      nome: clienteExisting.nome || primeiroItem.nomeComprador,
      totalPedidos: clienteExisting.totalPedidos + 1,
      totalGasto: clienteExisting.totalGasto + totalPedido
    });

    // Cupons
    if (primeiroItem.cupomDesconto && primeiroItem.desconto > 0) {
      const cupom = primeiroItem.cupomDesconto;
      const cupomExisting = cuponsMap.get(cupom) || { usos: 0, descontoTotal: 0, receitaGerada: 0 };
      cuponsMap.set(cupom, {
        usos: cupomExisting.usos + 1,
        descontoTotal: cupomExisting.descontoTotal + primeiroItem.desconto,
        receitaGerada: cupomExisting.receitaGerada + totalPedido
      });
    }

    // Produtos (processar todos os itens)
    items.forEach(item => {
      const produto = item.nomeProduto || 'Sem nome';
      const produtoExisting = produtosMap.get(produto) || { quantidade: 0, receita: 0 };
      produtosMap.set(produto, {
        quantidade: produtoExisting.quantidade + item.quantidadeComprada,
        receita: produtoExisting.receita + (item.valorProduto * item.quantidadeComprada)
      });
    });
  });

  const ticketMedio = totalPedidos > 0 ? receitaTotal / totalPedidos : 0;
  const totalVendas = vendas.reduce((sum, v) => sum + v.quantidadeComprada, 0);

  // Métricas de clientes
  const totalClientes = clientesMap.size;
  const clientesNovos = Array.from(clientesMap.values()).filter(c => c.totalPedidos === 1).length;
  const clientesRecorrentes = totalClientes - clientesNovos;
  const taxaRecompra = totalClientes > 0 ? (clientesRecorrentes / totalClientes) * 100 : 0;
  const ticketMedioPorCliente = totalClientes > 0 ? receitaTotal / totalClientes : 0;

  // Distribuição de clientes
  const distribuicaoClientes: { categoria: string; quantidade: number; percentual: number }[] = [];
  const dist = { '1': 0, '2-3': 0, '4-5': 0, '6+': 0 };
  clientesMap.forEach(cliente => {
    if (cliente.totalPedidos === 1) dist['1']++;
    else if (cliente.totalPedidos <= 3) dist['2-3']++;
    else if (cliente.totalPedidos <= 5) dist['4-5']++;
    else dist['6+']++;
  });

  Object.entries(dist).forEach(([categoria, quantidade]) => {
    distribuicaoClientes.push({
      categoria: categoria === '1' ? '1 pedido' : `${categoria} pedidos`,
      quantidade,
      percentual: totalClientes > 0 ? (quantidade / totalClientes) * 100 : 0
    });
  });

  // Top clientes
  const topClientes = Array.from(clientesMap.entries())
    .map(([email, data]) => ({
      email,
      nome: data.nome,
      totalPedidos: data.totalPedidos,
      totalGasto: data.totalGasto
    }))
    .sort((a, b) => b.totalGasto - a.totalGasto)
    .slice(0, 10);

  return {
    totalVendas,
    receitaTotal,
    ticketMedio,
    totalPedidos,
    pedidosPorStatus: Array.from(pedidosPorStatus.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count),
    vendasPorDia: Array.from(vendasPorDiaMap.entries())
      .map(([data, values]) => ({ data, ...values }))
      .sort((a, b) => a.data.localeCompare(b.data)),
    produtosMaisVendidos: Array.from(produtosMap.entries())
      .map(([produto, data]) => ({ produto, ...data }))
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 10),
    vendasPorEstado: Array.from(estadosMap.entries())
      .map(([estado, data]) => ({ estado, ...data }))
      .sort((a, b) => b.receita - a.receita),
    vendasPorCanal: Array.from(canaisMap.entries())
      .map(([canal, data]) => ({ canal, ...data }))
      .sort((a, b) => b.receita - a.receita),
    formasPagamento: Array.from(formasPagamentoMap.entries())
      .map(([forma, quantidade]) => ({ forma, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade),
    vendasPorPlataforma: [{ plataforma: 'WordPress', quantidade: totalPedidos, receita: receitaTotal }],
    totalClientes,
    clientesNovos,
    clientesRecorrentes,
    taxaRecompra,
    ticketMedioPorCliente,
    topClientes,
    distribuicaoClientes,
    usoCupons: Array.from(cuponsMap.entries())
      .map(([cupom, data]) => ({ cupom, ...data }))
      .sort((a, b) => b.receitaGerada - a.receitaGerada)
      .slice(0, 10)
  };
}
