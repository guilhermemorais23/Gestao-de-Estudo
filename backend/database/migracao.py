"""Migração simples: adiciona ao banco as colunas novas dos modelos, sem apagar nada.

O create_all do SQLAlchemy cria tabelas que não existem, mas não altera tabelas antigas.
Quando uma versão nova do sistema traz colunas novas, esta função as adiciona na inicialização.
"""
from sqlalchemy import inspect, text


def _padrao_sql(coluna):
    padrao = coluna.default
    if padrao is None or not getattr(padrao, "is_scalar", False):
        return ""
    valor = padrao.arg
    if isinstance(valor, bool):
        return f" DEFAULT {1 if valor else 0}"
    if isinstance(valor, (int, float)):
        return f" DEFAULT {valor}"
    if isinstance(valor, str):
        return " DEFAULT '" + valor.replace("'", "''") + "'"
    return ""


def adicionar_colunas_novas(engine, base):
    inspetor = inspect(engine)
    tabelas = set(inspetor.get_table_names())
    with engine.begin() as conexao:
        for tabela in base.metadata.sorted_tables:
            if tabela.name not in tabelas:
                continue  # tabela nova: o create_all já cria completa
            existentes = {c["name"] for c in inspetor.get_columns(tabela.name)}
            for coluna in tabela.columns:
                if coluna.name in existentes:
                    continue
                tipo = coluna.type.compile(dialect=engine.dialect)
                conexao.execute(text(f'ALTER TABLE {tabela.name} ADD COLUMN "{coluna.name}" {tipo}{_padrao_sql(coluna)}'))
                print(f"[migração] coluna adicionada: {tabela.name}.{coluna.name}")
