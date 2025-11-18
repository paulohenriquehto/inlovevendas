export interface Venda {
  numeroPedido: string;
  email: string;
  data: string;
  statusPedido: string;
  statusPagamento: string;
  statusEnvio: string;
  moeda: string;
  subtotal: number;
  desconto: number;
  valorFrete: number;
  total: number;
  nomeComprador: string;
  cpfCnpj: string;
  telefone: string;
  nomeEntrega: string;
  telefoneEntrega: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  codigoPostal: string;
  estado: string;
  pais: string;
  formaEntrega: string;
  formaPagamento: string;
  cupomDesconto: string;
  anotacoesComprador: string;
  anotacoesVendedor: string;
  dataPagamento: string;
  dataEnvio: string;
  nomeProduto: string;
  valorProduto: number;
  quantidadeComprada: number;
  sku: string;
  canal: string;
  plataforma: string;
  codigoRastreio: string;
  identificadorTransacao: string;
  identificadorPedido: string;
  produtoFisico: string;
  pessoaRegistrou: string;
  localVenda: string;
  vendedor: string;
  dataCancelamento: string;
  motivoCancelamento: string;

  // Campos calculados - Métricas do Cliente
  totalPedidosCliente?: number;      // Quantos pedidos este cliente já fez
  primeiraCompraCliente?: boolean;   // true se for primeira compra do cliente
}

export interface DashboardMetrics {
  totalVendas: number;
  receitaTotal: number;
  ticketMedio: number;
  totalPedidos: number;
  pedidosPorStatus: { status: string; count: number; }[];
  vendasPorDia: { data: string; total: number; quantidade: number; }[];
  produtosMaisVendidos: { produto: string; quantidade: number; receita: number; }[];
  vendasPorEstado: { estado: string; quantidade: number; receita: number; }[];
  vendasPorCanal: { canal: string; quantidade: number; receita: number; }[];
  formasPagamento: { forma: string; quantidade: number; }[];
  vendasPorPlataforma: { plataforma: string; quantidade: number; receita: number; }[];

  // Novas Métricas de Clientes
  totalClientes: number;              // Total de clientes únicos
  clientesNovos: number;              // Clientes com apenas 1 pedido
  clientesRecorrentes: number;        // Clientes com 2+ pedidos
  taxaRecompra: number;               // % de clientes que voltaram a comprar
  ticketMedioPorCliente: number;      // Gasto médio por cliente (não por pedido)
  tempoMedioPagamento?: number;       // Dias entre pedido e pagamento

  // Top Clientes
  topClientes: {
    email: string;
    nome: string;
    cpf?: string;
    totalPedidos: number;
    totalGasto: number;
  }[];

  // Distribuição de Clientes por Frequência
  distribuicaoClientes: {
    categoria: string;                // "1 pedido", "2-3 pedidos", "4-5", "6+"
    quantidade: number;
    percentual: number;
  }[];

  // Análise de Cupons de Desconto
  usoCupons: {
    cupom: string;
    usos: number;
    descontoTotal: number;
    receitaGerada: number;
  }[];
}
