# Dashboard de Vendas - Análise Completa

Dashboard interativo criado com Next.js 14 para análise de vendas de alianças e joias, utilizando dados reais de uma planilha CSV com mais de 3.5MB de informações.

## Características

### Dados Utilizados
- **100% dados reais** - Nenhum dado fictício foi utilizado
- Carregamento e processamento de arquivo CSV de 3.5MB
- Análise de milhares de registros de vendas
- Dados de pedidos, clientes, produtos, valores e localizações

### Funcionalidades Principais

#### 1. KPIs Principais
- **Receita Total**: Soma de todas as vendas realizadas
- **Total de Pedidos**: Número de pedidos únicos
- **Ticket Médio**: Valor médio por pedido
- **Produtos Vendidos**: Total de itens vendidos

#### 2. Análises Visuais

**Vendas ao Longo do Tempo**
- Gráfico de linha mostrando evolução temporal
- Duas métricas: receita (R$) e quantidade de pedidos
- Datas formatadas e ordenadas cronologicamente

**Status de Pagamento**
- Gráfico de pizza com distribuição dos status
- Categorias: Confirmado, Pendente, Recusado

**Formas de Pagamento**
- Gráfico de barras com métodos de pagamento
- Análise de preferências dos clientes

**Top 10 Produtos Mais Vendidos**
- Gráfico de barras horizontal
- Métricas: quantidade vendida e receita gerada
- Nomes completos dos produtos

**Vendas por Estado**
- Análise geográfica detalhada
- Dupla visualização: quantidade e receita
- Identificação de regiões principais

**Vendas por Canal**
- Distribuição por canal de venda (Mobile, Loja virtual, etc.)
- Comparativo de performance entre canais

#### 3. Tabela de Pedidos Detalhada
- Página separada com todos os pedidos
- **Busca em tempo real** por:
  - Número do pedido
  - Nome do cliente
  - Email
  - Cidade
  - Estado
  - Status de pagamento
- **Paginação inteligente** (20 itens por página)
- **Informações exibidas**:
  - Dados do pedido e data
  - Informações do cliente
  - Localização completa
  - Valor total
  - Status de pagamento (com cores)
  - Status de envio
  - Canal de venda

## Stack Tecnológica

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI modernos
- **Recharts** - Biblioteca de gráficos
- **PapaCSV** - Processamento de CSV
- **Lucide React** - Ícones

## Estrutura do Projeto

```
dashboard-vendas/
├── app/
│   ├── page.tsx              # Página principal com dashboard
│   ├── pedidos/
│   │   └── page.tsx          # Página de tabela de pedidos
│   └── layout.tsx
├── components/
│   ├── ui/                   # Componentes shadcn/ui
│   └── MetricCard.tsx        # Card de métricas
├── lib/
│   ├── types.ts              # Tipos TypeScript
│   ├── csvProcessor.ts       # Processamento do CSV
│   └── utils.ts
└── public/
    └── vendas.csv            # Arquivo CSV com dados reais
```

## Processamento de Dados

### csvProcessor.ts
- **loadCSVData()**: Carrega e processa o arquivo CSV
  - Tratamento de encoding especial (caracteres portugueses)
  - Mapeamento de colunas para campos TypeScript
  - Conversão de valores numéricos
  - Filtragem de linhas vazias

- **calculateMetrics()**: Calcula todas as métricas
  - Agrupa vendas por pedido (tratamento de múltiplos produtos)
  - Calcula totais e médias
  - Gera análises temporais, geográficas e de produtos
  - Ordena e filtra dados para visualização

## Como Executar

1. Instalar dependências:
```bash
npm install
```

2. Executar em desenvolvimento:
```bash
npm run dev
```

3. Acessar:
- Dashboard principal: http://localhost:3000
- Tabela de pedidos: http://localhost:3000/pedidos

4. Build para produção:
```bash
npm run build
npm start
```

## Recursos de Acessibilidade

- Componentes semânticos
- Contraste adequado de cores
- Navegação por teclado
- Labels descritivos

## Performance

- Carregamento otimizado do CSV
- Cálculos realizados uma única vez
- Paginação para grandes volumes
- Componentes React otimizados

## Análises Disponíveis

1. **Temporal**: Vendas por dia, tendências
2. **Geográfica**: Distribuição por estado e cidade
3. **Produtos**: Rankings de vendas
4. **Financeira**: Receitas, tickets médios
5. **Operacional**: Status de pedidos e envios
6. **Canais**: Performance por canal de venda

## Próximas Melhorias Possíveis

- Exportação de relatórios (PDF, Excel)
- Filtros avançados por período
- Comparativos mês a mês
- Análise de margem de desconto
- Mapa interativo de vendas
- Análise de produtos frequentemente vendidos juntos
- Dashboard de vendedor individual
