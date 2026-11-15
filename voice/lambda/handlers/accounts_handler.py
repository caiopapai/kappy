import logging
import time

from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.utils import is_intent_name
from ask_sdk_core.handler_input import HandlerInput
from ask_sdk_model import Response

from services.sheets_service import SheetsService
from utils.responses import speak_balance, speak_account_type

logger = logging.getLogger(__name__)
sheets = SheetsService()


ACCOUNT_TYPE_MAP = {
    # Português
    "conta corrente":    "checking",
    "corrente":          "checking",
    "poupança":          "savings",
    "poupanca":          "savings",
    "investimento":      "investment",
    "cartão de crédito": "credit_card",
    "cartao de credito": "credit_card",
    "crédito pessoal":   "personal_credit",
    "credito pessoal":   "personal_credit",
    "crédito de carro":  "car_credit",
    "credito de carro":  "car_credit",
    "crédito habitação": "housing_credit",
    "credito habitacao": "housing_credit",
    # Inglês
    "checking":          "checking",
    "savings":           "savings",
    "investment":        "investment",
    "credit card":       "credit_card",
}

CURRENCY_MAP = {
    "euro":    "EUR",
    "euros":   "EUR",
    "eur":     "EUR",
    "real":    "BRL",
    "reais":   "BRL",
    "brl":     "BRL",
    "dólar":   "USD",
    "dolar":   "USD",
    "dólares": "USD",
    "dolares": "USD",
    "usd":     "USD",
}


def resolve_slot(handler_input, slot_name):
    """
    Devolve o valor resolvido do slot.
    Para custom slot types (AccountName, AccountType, CurrencyType),
    lê o valor canónico das resolutions.
    Para built-in types (AMAZON.NUMBER), lê o .value directamente.
    Devolve None se o slot não estiver preenchido.
    """
    slots = handler_input.request_envelope.request.intent.slots
    if slot_name not in slots or slots[slot_name] is None:
        return None

    slot = slots[slot_name]

    try:
        resolutions = slot.resolutions.resolutions_per_authority
        if resolutions:
            for resolution in resolutions:
                if resolution.status.code.value == "ER_SUCCESS_MATCH":
                    return resolution.values[0].value.name.lower()
    except (AttributeError, IndexError, TypeError):
        pass

    if slot.value is not None:
        return slot.value.strip().lower()

    return None


def resolve_slot_raw(handler_input, slot_name):
    """
    Igual ao resolve_slot mas preserva capitalização original.
    Usado para o nome da conta (accountName).
    """
    slots = handler_input.request_envelope.request.intent.slots
    if slot_name not in slots or slots[slot_name] is None:
        return None

    slot = slots[slot_name]

    try:
        resolutions = slot.resolutions.resolutions_per_authority
        if resolutions:
            for resolution in resolutions:
                if resolution.status.code.value == "ER_SUCCESS_MATCH":
                    return resolution.values[0].value.name.title()
    except (AttributeError, IndexError, TypeError):
        pass

    # Fallback
    if slot.value is not None:
        return slot.value.strip().title()

    return None


class CreateAccountIntentHandler(AbstractRequestHandler):
    """
    Utterances exemplo:
      "cria uma conta chamada Conta BCP"
      "adiciona uma conta corrente chamada Poupança Casa com saldo de 500 euros"
      "cria uma poupança chamada Férias com 1500 euros"
    """

    def can_handle(self, handler_input):
        return is_intent_name("CreateAccountIntent")(handler_input)

    def handle(self, handler_input) -> Response:
        name     = resolve_slot_raw(handler_input, "accountName")
        acc_type = resolve_slot(handler_input, "accountType")
        balance  = resolve_slot(handler_input, "balance")
        currency = resolve_slot(handler_input, "currency")

        if not name:
            return (
                handler_input.response_builder
                    .speak("Como se chama a conta que queres criar?")
                    .ask("Qual é o nome da conta?")
                    .response
            )

        if not acc_type:
            return (
                handler_input.response_builder
                    .speak(
                        f"Que tipo de conta é a {name}? "
                        "Pode ser conta corrente, poupança, investimento, "
                        "cartão de crédito, crédito pessoal, crédito de carro "
                        "ou crédito habitação."
                    )
                    .ask("Qual é o tipo de conta?")
                    .response
            )

        mapped_type = ACCOUNT_TYPE_MAP.get(acc_type, "checking")

        bal_value = 0.0
        if balance:
            try:
                bal_value = float(balance.replace(",", "."))
            except ValueError:
                bal_value = 0.0

        cur_value = "EUR"
        if currency:
            cur_value = CURRENCY_MAP.get(currency, "EUR")

        account = {
            "id":       int(time.time() * 1000),
            "name":     name,
            "type":     mapped_type,
            "balance":  bal_value,
            "currency": cur_value,
        }

        try:
            sheets.save_account(account)
            speak = (
                f"Conta {name} criada com sucesso. "
                f"Tipo: {speak_account_type(mapped_type)}. "
                f"Saldo inicial: {speak_balance(bal_value, cur_value)}."
            )
        except Exception as e:
            logger.error(f"Erro ao criar conta: {e}")
            speak = f"Não consegui guardar a conta {name}. Verifica a ligação e tenta novamente."

        return (
            handler_input.response_builder
                .speak(speak)
                .response
        )

class UpdateAccountIntentHandler(AbstractRequestHandler):
    """
    Utterances exemplo:
      "actualiza o saldo da Conta BCP para 2000 euros"
      "muda o saldo da poupança para 3500"
      "actualiza a Conta Principal para menos 200 euros"
    """

    def can_handle(self, handler_input):
        return is_intent_name("UpdateAccountIntent")(handler_input)

    def handle(self, handler_input) -> Response:
        name       = resolve_slot_raw(handler_input, "accountName")
        new_balance= resolve_slot(handler_input, "newBalance")
        currency   = resolve_slot(handler_input, "currency")

        if not name:
            return (
                handler_input.response_builder
                    .speak("Qual é o nome da conta que queres actualizar?")
                    .ask("Qual conta queres actualizar?")
                    .response
            )

        if not new_balance:
            return (
                handler_input.response_builder
                    .speak(f"Qual é o novo saldo da conta {name}?")
                    .ask("Qual é o novo saldo?")
                    .response
            )

        try:
            bal_value = float(new_balance.replace(",", "."))
        except ValueError:
            return (
                handler_input.response_builder
                    .speak("Não percebi o valor do saldo. Podes repetir?")
                    .ask("Qual é o novo saldo?")
                    .response
            )

        cur_value = "EUR"
        if currency:
            cur_value = CURRENCY_MAP.get(currency, "EUR")

        try:
            accounts = sheets.get_accounts()
            account = next(
                (a for a in accounts if a["name"].lower() == name.lower()),
                None
            )

            if not account:
                speak = (
                    f"Não encontrei nenhuma conta com o nome {name}. "
                    "Verifica o nome e tenta novamente."
                )
            else:
                account["balance"]  = bal_value
                account["currency"] = cur_value
                sheets.save_account(account)
                speak = (
                    f"Saldo da conta {name} actualizado para "
                    f"{speak_balance(bal_value, cur_value)}."
                )
        except Exception as e:
            logger.error(f"Erro ao actualizar conta: {e}")
            speak = f"Não consegui actualizar a conta {name}. Tenta novamente."

        return (
            handler_input.response_builder
                .speak(speak)
                .response
        )

class DeleteAccountIntentHandler(AbstractRequestHandler):
    """
    Utterances exemplo:
      "apaga a conta Conta BCP"
      "elimina a poupança Férias"
      "remove a conta Principal"
    """

    def can_handle(self, handler_input):
        return is_intent_name("DeleteAccountIntent")(handler_input)

    def handle(self, handler_input) -> Response:
        name = resolve_slot_raw(handler_input, "accountName")

        if not name:
            return (
                handler_input.response_builder
                    .speak("Qual é o nome da conta que queres apagar?")
                    .ask("Qual conta queres apagar?")
                    .response
            )

        try:
            accounts = sheets.get_accounts()
            account = next(
                (a for a in accounts if a["name"].lower() == name.lower()),
                None
            )

            if not account:
                speak = (
                    f"Não encontrei a conta {name}. "
                    "Verifica o nome e tenta novamente."
                )
            else:
                sheets.delete_account(account["id"])
                speak = f"Conta {name} apagada com sucesso."

        except Exception as e:
            logger.error(f"Erro ao apagar conta: {e}")
            speak = f"Não consegui apagar a conta {name}. Tenta novamente."

        return (
            handler_input.response_builder
                .speak(speak)
                .response
        )

class ListAccountsIntentHandler(AbstractRequestHandler):
    """
    Utterances exemplo:
      "quais são as minhas contas"
      "lista as contas"
      "que contas tenho"
      "mostra as minhas contas"
    """

    def can_handle(self, handler_input):
        return is_intent_name("ListAccountsIntent")(handler_input)

    def handle(self, handler_input) -> Response:
        try:
            accounts = sheets.get_accounts()

            if not accounts:
                speak = "Ainda não tens nenhuma conta criada no Kappy."
            elif len(accounts) == 1:
                a = accounts[0]
                speak = (
                    f"Tens uma conta: {a['name']}, "
                    f"{speak_account_type(a['type'])}, "
                    f"com saldo de {speak_balance(a['balance'], a['currency'])}."
                )
            else:
                items = []
                for a in accounts:
                    items.append(
                        f"{a['name']}, {speak_balance(a['balance'], a['currency'])}"
                    )
                lista = ". ".join(items)
                speak = (
                    f"Tens {len(accounts)} contas: {lista}. "
                    f"O total é {speak_total(accounts)}."
                )

        except Exception as e:
            logger.error(f"Erro ao listar contas: {e}")
            speak = "Não consegui obter as tuas contas. Tenta novamente."

        return (
            handler_input.response_builder
                .speak(speak)
                .response
        )


def speak_total(accounts):
    """Calcula o total por moeda e formata para voz."""
    totals = {}
    for a in accounts:
        cur = a.get("currency", "EUR")
        totals[cur] = totals.get(cur, 0) + float(a.get("balance", 0))

    parts = []
    for cur, val in totals.items():
        parts.append(speak_balance(val, cur))
    return " e ".join(parts)