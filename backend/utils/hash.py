import bcrypt


def gerar_hash_senha(senha_limpa: str) -> str:
    return bcrypt.hashpw(senha_limpa.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verificar_senha(senha_limpa: str, senha_hashed: str) -> bool:
    return bcrypt.checkpw(senha_limpa.encode("utf-8"), senha_hashed.encode("utf-8"))
