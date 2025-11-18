# Database - Dashboard de Vendas

Configuração e scripts para o banco de dados PostgreSQL do Dashboard de Vendas.

## 📋 Estrutura

```
database/
├── init/
│   └── 01-create-schema.sql    # Schema do banco (tabelas, índices, views)
├── import_nuvemshop.py          # Script de importação de dados
├── requirements.txt             # Dependências Python
├── .env.example                 # Exemplo de variáveis de ambiente
└── README.md                    # Este arquivo
```

## 🚀 Início Rápido

### 1. Subir o PostgreSQL com Docker

Na raiz do projeto:

```bash
docker-compose up -d
```

Isso irá:
- Criar um container PostgreSQL
- Criar o banco de dados `dashboard_vendas`
- Executar automaticamente o script `01-create-schema.sql`
- Expor a porta `5433` (mapeada para 5432 interna)

### 2. Verificar se o banco está rodando

```bash
docker-compose ps
```

### 3. Instalar dependências Python

```bash
cd database
pip install -r requirements.txt
```

### 4. Importar dados da Nuvemshop

```bash
cd database
python import_nuvemshop.py
```

## 🗄️ Estrutura do Banco de Dados

### Tabela: `pedidos`

Armazena informações gerais dos pedidos.

**Principais campos:**
- `numero_pedido`: Número único do pedido
- `data_pedido`, `data_pagamento`, `data_envio`: Datas do pedido
- `status_pedido`, `status_pagamento`, `status_envio`: Status
- `total`, `subtotal`, `desconto`, `valor_frete`: Valores
- `nome_comprador`, `email`, `cpf_cnpj`: Dados do cliente
- `endereco`, `cidade`, `estado`: Dados de entrega
- `forma_pagamento`, `forma_entrega`: Métodos
- `canal`: Canal de venda (Loja virtual, Mobile, etc)

### Tabela: `itens_pedido`

Armazena os produtos/itens de cada pedido (relacionamento 1:N com pedidos).

**Principais campos:**
- `pedido_id`: Referência ao pedido
- `nome_produto`: Nome do produto
- `sku`: Código do produto
- `valor_produto`: Valor unitário
- `quantidade`: Quantidade comprada

### View: `vw_pedidos_completos`

View agregada com pedidos e contagem de itens.

## 🔌 Conectar ao Banco

### Via linha de comando (psql)

```bash
docker exec -it dashboard-vendas-db psql -U dashboard_user -d dashboard_vendas
```

### Via aplicação (connection string)

```
postgresql://dashboard_user:dashboard_pass@localhost:5433/dashboard_vendas
```

### Via Node.js (exemplo com pg)

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'dashboard_vendas',
  user: 'dashboard_user',
  password: 'dashboard_pass'
});
```

## 📊 Queries Úteis

### Total de pedidos

```sql
SELECT COUNT(*) FROM pedidos;
```

### Pedidos por status

```sql
SELECT status_pedido, COUNT(*) as total
FROM pedidos
GROUP BY status_pedido
ORDER BY total DESC;
```

### Top 10 produtos mais vendidos

```sql
SELECT
    nome_produto,
    COUNT(*) as total_vendas,
    SUM(quantidade) as total_unidades
FROM itens_pedido
GROUP BY nome_produto
ORDER BY total_vendas DESC
LIMIT 10;
```

### Receita por mês

```sql
SELECT
    DATE_TRUNC('month', data_pedido) as mes,
    COUNT(*) as total_pedidos,
    SUM(total) as receita_total
FROM pedidos
WHERE status_pagamento = 'Aprovado'
GROUP BY mes
ORDER BY mes DESC;
```

### Pedidos completos com itens

```sql
SELECT * FROM vw_pedidos_completos
ORDER BY data_pedido DESC
LIMIT 10;
```

## 🛠️ Comandos Docker Úteis

### Parar o banco
```bash
docker-compose down
```

### Parar e remover dados
```bash
docker-compose down -v
```

### Ver logs
```bash
docker-compose logs -f postgres
```

### Backup do banco
```bash
docker exec dashboard-vendas-db pg_dump -U dashboard_user dashboard_vendas > backup.sql
```

### Restaurar backup
```bash
docker exec -i dashboard-vendas-db psql -U dashboard_user -d dashboard_vendas < backup.sql
```

## 📝 Credenciais Padrão

**ATENÇÃO:** Altere as credenciais em produção!

- **Host:** localhost
- **Porta:** 5433
- **Database:** dashboard_vendas
- **Usuário:** dashboard_user
- **Senha:** dashboard_pass

## 🔄 Re-importar Dados

Se precisar limpar e re-importar os dados:

```bash
# Conectar ao banco
docker exec -it dashboard-vendas-db psql -U dashboard_user -d dashboard_vendas

# Dentro do psql:
TRUNCATE TABLE itens_pedido, pedidos RESTART IDENTITY CASCADE;
\q

# Re-importar
cd database
python import_nuvemshop.py
```

## 🧪 Testar Conexão

```bash
docker exec dashboard-vendas-db pg_isready -U dashboard_user -d dashboard_vendas
```

Se retornar "accepting connections", está funcionando!

## 📚 Mais Informações

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [psycopg2 Documentation](https://www.psycopg.org/docs/)
