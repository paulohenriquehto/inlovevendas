#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para importar dados do CSV da Nuvemshop para PostgreSQL
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime
import sys
import os

# Configurações de conexão
DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'dashboard_vendas',
    'user': 'dashboard_user',
    'password': 'dashboard_pass'
}

# Caminho do CSV
CSV_PATH = '../Nuvemshop/nuvemshop.csv'

def parse_date(date_str):
    """Converte string de data para formato PostgreSQL"""
    if pd.isna(date_str) or date_str == '':
        return None
    try:
        # Formato: "15/11/2025 21:37:10"
        return datetime.strptime(date_str, '%d/%m/%Y %H:%M:%S')
    except:
        return None

def parse_decimal(value):
    """Converte string para decimal"""
    if pd.isna(value) or value == '':
        return 0
    try:
        # Remove separadores de milhares e substitui vírgula por ponto
        if isinstance(value, str):
            value = value.replace('.', '').replace(',', '.')
        return float(value)
    except:
        return 0

def parse_boolean(value):
    """Converte string para boolean"""
    if pd.isna(value) or value == '':
        return True
    return str(value).lower() in ['sim', 'yes', 'true', '1']

def connect_db():
    """Conecta ao banco de dados"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("✓ Conectado ao PostgreSQL com sucesso!")
        return conn
    except Exception as e:
        print(f"✗ Erro ao conectar ao PostgreSQL: {e}")
        sys.exit(1)

def load_csv():
    """Carrega o CSV"""
    try:
        print(f"Carregando CSV de: {CSV_PATH}")

        # Lê o CSV com encoding correto (iso-8859-1 / latin-1)
        df = pd.read_csv(
            CSV_PATH,
            sep=';',
            encoding='iso-8859-1',
            dtype=str  # Lê tudo como string primeiro
        )

        print(f"✓ CSV carregado: {len(df)} linhas, {len(df.columns)} colunas")
        print(f"Colunas: {df.columns.tolist()}")

        return df
    except Exception as e:
        print(f"✗ Erro ao carregar CSV: {e}")
        sys.exit(1)

def import_data(conn, df):
    """Importa dados do DataFrame para o banco"""
    cursor = conn.cursor()

    try:
        # Agrupa por número do pedido
        pedidos_unicos = df.groupby('Número do Pedido')

        total_pedidos = len(pedidos_unicos)
        total_itens = len(df)

        print(f"\nIniciando importação:")
        print(f"  - {total_pedidos} pedidos únicos")
        print(f"  - {total_itens} itens de produtos")

        pedidos_importados = 0
        itens_importados = 0

        for numero_pedido, grupo in pedidos_unicos:
            # Pega a primeira linha do grupo para dados do pedido
            primeira_linha = grupo.iloc[0]

            # Prepara dados do pedido
            pedido_data = {
                'numero_pedido': numero_pedido,
                'identificador_pedido': primeira_linha.get('Identificador do pedido', ''),
                'data_pedido': parse_date(primeira_linha.get('Data', '')),
                'data_pagamento': parse_date(primeira_linha.get('Data de pagamento', '')),
                'data_envio': parse_date(primeira_linha.get('Data de envío', '')),
                'data_cancelamento': parse_date(primeira_linha.get('Data e hora do cancelamento', '')),
                'status_pedido': primeira_linha.get('Status do Pedido', ''),
                'status_pagamento': primeira_linha.get('Status do Pagamento', ''),
                'status_envio': primeira_linha.get('Status do Envio', ''),
                'moeda': primeira_linha.get('Moeda', 'BRL'),
                'subtotal': parse_decimal(primeira_linha.get('Subtotal', 0)),
                'desconto': parse_decimal(primeira_linha.get('Desconto', 0)),
                'valor_frete': parse_decimal(primeira_linha.get('Valor do Frete', 0)),
                'total': parse_decimal(primeira_linha.get('Total', 0)),
                'email': primeira_linha.get('E-mail', ''),
                'nome_comprador': primeira_linha.get('Nome do comprador', ''),
                'cpf_cnpj': primeira_linha.get('CPF / CNPJ', ''),
                'telefone': primeira_linha.get('Telefone', ''),
                'nome_entrega': primeira_linha.get('Nome para a entrega', ''),
                'telefone_entrega': primeira_linha.get('Telefone para a entrega', ''),
                'endereco': primeira_linha.get('Endereço', ''),
                'numero': primeira_linha.get('Número', ''),
                'complemento': primeira_linha.get('Complemento', ''),
                'bairro': primeira_linha.get('Bairro', ''),
                'cidade': primeira_linha.get('Cidade', ''),
                'codigo_postal': primeira_linha.get('Código postal', ''),
                'estado': primeira_linha.get('Estado', ''),
                'pais': primeira_linha.get('País', ''),
                'forma_entrega': primeira_linha.get('Forma de Entrega', ''),
                'forma_pagamento': primeira_linha.get('Forma de Pagamento', ''),
                'codigo_rastreio': primeira_linha.get('Código de rastreio do envio', ''),
                'identificador_transacao': primeira_linha.get('Identificador da transação no meio de pagamento', ''),
                'cupom_desconto': primeira_linha.get('Cupom de Desconto', ''),
                'anotacoes_comprador': primeira_linha.get('Anotações do Comprador', ''),
                'anotacoes_vendedor': primeira_linha.get('Anotações do Vendedor', ''),
                'motivo_cancelamento': primeira_linha.get('Motivo do cancelamento', ''),
                'canal': primeira_linha.get('Canal', ''),
                'pessoa_registrou_venda': primeira_linha.get('Pessoa que registrou a venda', ''),
                'local_venda': primeira_linha.get('Local de venda', ''),
                'vendedor': primeira_linha.get('Vendedor', '')
            }

            # Insere pedido
            insert_pedido = """
                INSERT INTO pedidos (
                    numero_pedido, identificador_pedido, data_pedido, data_pagamento, data_envio,
                    data_cancelamento, status_pedido, status_pagamento, status_envio, moeda,
                    subtotal, desconto, valor_frete, total, email, nome_comprador, cpf_cnpj,
                    telefone, nome_entrega, telefone_entrega, endereco, numero, complemento,
                    bairro, cidade, codigo_postal, estado, pais, forma_entrega, forma_pagamento,
                    codigo_rastreio, identificador_transacao, cupom_desconto, anotacoes_comprador,
                    anotacoes_vendedor, motivo_cancelamento, canal, pessoa_registrou_venda,
                    local_venda, vendedor
                ) VALUES (
                    %(numero_pedido)s, %(identificador_pedido)s, %(data_pedido)s, %(data_pagamento)s,
                    %(data_envio)s, %(data_cancelamento)s, %(status_pedido)s, %(status_pagamento)s,
                    %(status_envio)s, %(moeda)s, %(subtotal)s, %(desconto)s, %(valor_frete)s,
                    %(total)s, %(email)s, %(nome_comprador)s, %(cpf_cnpj)s, %(telefone)s,
                    %(nome_entrega)s, %(telefone_entrega)s, %(endereco)s, %(numero)s,
                    %(complemento)s, %(bairro)s, %(cidade)s, %(codigo_postal)s, %(estado)s,
                    %(pais)s, %(forma_entrega)s, %(forma_pagamento)s, %(codigo_rastreio)s,
                    %(identificador_transacao)s, %(cupom_desconto)s, %(anotacoes_comprador)s,
                    %(anotacoes_vendedor)s, %(motivo_cancelamento)s, %(canal)s,
                    %(pessoa_registrou_venda)s, %(local_venda)s, %(vendedor)s
                )
                ON CONFLICT (numero_pedido) DO NOTHING
                RETURNING id
            """

            cursor.execute(insert_pedido, pedido_data)
            result = cursor.fetchone()

            if result:
                pedido_id = result[0]
                pedidos_importados += 1

                # Insere itens do pedido
                for _, item in grupo.iterrows():
                    item_data = {
                        'pedido_id': pedido_id,
                        'numero_pedido': numero_pedido,
                        'nome_produto': item.get('Nome do Produto', ''),
                        'sku': item.get('SKU', ''),
                        'valor_produto': parse_decimal(item.get('Valor do Produto', 0)),
                        'quantidade': int(parse_decimal(item.get('Quantidade Comprada', 1))),
                        'produto_fisico': parse_boolean(item.get('Produto Fisico', 'Sim'))
                    }

                    insert_item = """
                        INSERT INTO itens_pedido (
                            pedido_id, numero_pedido, nome_produto, sku,
                            valor_produto, quantidade, produto_fisico
                        ) VALUES (
                            %(pedido_id)s, %(numero_pedido)s, %(nome_produto)s, %(sku)s,
                            %(valor_produto)s, %(quantidade)s, %(produto_fisico)s
                        )
                    """

                    cursor.execute(insert_item, item_data)
                    itens_importados += 1

            # Commit a cada 100 pedidos
            if pedidos_importados % 100 == 0:
                conn.commit()
                print(f"  Progresso: {pedidos_importados}/{total_pedidos} pedidos...")

        # Commit final
        conn.commit()

        print(f"\n✓ Importação concluída com sucesso!")
        print(f"  - {pedidos_importados} pedidos importados")
        print(f"  - {itens_importados} itens importados")

    except Exception as e:
        conn.rollback()
        print(f"\n✗ Erro durante importação: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        cursor.close()

def main():
    """Função principal"""
    print("=" * 60)
    print("IMPORTAÇÃO DE DADOS NUVEMSHOP PARA POSTGRESQL")
    print("=" * 60)

    # Carrega CSV
    df = load_csv()

    # Conecta ao banco
    conn = connect_db()

    # Importa dados
    import_data(conn, df)

    # Fecha conexão
    conn.close()
    print("\n✓ Processo finalizado!")

if __name__ == '__main__':
    main()
