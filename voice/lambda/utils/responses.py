# lambda/utils/responses.py
# Helpers para formatar valores de forma natural para voz.
# A Alexa lê o texto tal qual — números e moedas têm de soar bem em português.

ACCOUNT_TYPE_LABELS = {
    "checking":        "conta corrente",
    "savings":         "poupança",
    "investment":      "investimento",
    "credit_card":     "cartão de crédito",
    "personal_credit": "crédito pessoal",
    "car_credit":      "crédito de carro",
    "housing_credit":  "crédito habitação",
}

CURRENCY_LABELS = {
    "EUR": "euros",
    "BRL": "reais",
    "USD": "dólares",
}


def speak_balance(amount: float, currency: str = "EUR") -> str:
    """
    Formata um saldo para ser lido pela Alexa.
    Exemplos:
      1500.0,  "EUR" → "1500 euros"
      -320.5,  "EUR" → "menos 320 euros e 50 cêntimos"
      38000.0, "BRL" → "38 mil reais"
    """
    cur_label = CURRENCY_LABELS.get(currency, currency)
    negative  = amount < 0
    abs_amount = abs(amount)

    # Arredonda para 2 casas decimais
    euros   = int(abs_amount)
    centimos= round((abs_amount - euros) * 100)

    # Simplifica milhares para leitura mais natural
    if euros >= 1_000_000:
        main = f"{euros / 1_000_000:.1f} milhões"
    elif euros >= 1_000:
        if euros % 1_000 == 0:
            main = f"{euros // 1_000} mil"
        else:
            main = f"{euros // 1_000} mil e {euros % 1_000}"
    else:
        main = str(euros)

    if centimos > 0:
        if currency == "EUR":
            result = f"{main} {cur_label} e {centimos} cêntimos"
        else:
            result = f"{main} {cur_label} e {centimos} centavos"
    else:
        result = f"{main} {cur_label}"

    return ("menos " + result) if negative else result


def speak_account_type(account_type: str) -> str:
    """Converte o tipo interno para texto falado."""
    return ACCOUNT_TYPE_LABELS.get(account_type, account_type.replace("_", " "))


def speak_currency(currency: str) -> str:
    """Converte o código de moeda para texto falado."""
    return CURRENCY_LABELS.get(currency, currency)