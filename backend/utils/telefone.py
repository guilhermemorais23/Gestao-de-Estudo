import re


def so_digitos(texto: str | None) -> str:
    return re.sub(r"\D", "", texto or "")


def telefone_whatsapp(internacional: str | None, nacional: str | None) -> str:
    """Retorna o número no formato do wa.me (só dígitos, com DDI)."""
    digitos = so_digitos(internacional)
    if digitos:
        return digitos
    digitos = so_digitos(nacional).lstrip("0")
    if not digitos:
        return ""
    # número brasileiro sem DDI: DDD (2) + 8 ou 9 dígitos
    if len(digitos) in (10, 11):
        return "55" + digitos
    return digitos


def provavel_celular(numero_wa: str) -> bool:
    """No Brasil, celular = 55 + DDD + 9 dígitos começando com 9 (fixo raramente tem WhatsApp)."""
    if numero_wa.startswith("55"):
        resto = numero_wa[2:]
        return len(resto) == 11 and resto[2] == "9"
    return bool(numero_wa)
