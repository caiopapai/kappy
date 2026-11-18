import os
import json
import urllib.request
import urllib.error
import logging

logger = logging.getLogger(__name__)

SHEETS_URL = os.environ.get("KAPPY_SHEETS_URL", "")


class SheetsService:

    def _get(self, sheet: str) -> list:
        """GET ?sheet=<name> → lista de objectos."""
        if not SHEETS_URL:
            raise RuntimeError("KAPPY_SHEETS_URL não configurado nas variáveis de ambiente.")

        url = f"{SHEETS_URL}?sheet={sheet}"
        req = urllib.request.Request(url)

        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                body = json.loads(res.read().decode("utf-8"))
                if not body.get("ok"):
                    raise RuntimeError(body.get("error", "Erro desconhecido"))
                return body.get("data", [])
        except urllib.error.URLError as e:
            logger.error(f"Erro de rede ao ler {sheet}: {e}")
            raise

    def _post(self, payload: dict) -> dict:
        """POST com JSON body → resposta do Apps Script."""
        if not SHEETS_URL:
            raise RuntimeError("KAPPY_SHEETS_URL não configurado nas variáveis de ambiente.")

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            SHEETS_URL,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                body = json.loads(res.read().decode("utf-8"))
                if not body.get("ok"):
                    raise RuntimeError(body.get("error", "Erro desconhecido"))
                return body
        except urllib.error.URLError as e:
            logger.error(f"Erro de rede ao escrever: {e}")
            raise

    def get_accounts(self) -> list:
        """Devolve todas as contas da sheet."""
        return self._get("accounts")

    def save_account(self, account: dict) -> dict:
        """Cria ou actualiza uma conta (upsert por id)."""
        return self._post({
            "action": "upsert",
            "sheet":  "accounts",
            "row":    account,
        })

    def delete_account(self, account_id: int) -> bool:
        """Elimina uma conta pelo id."""
        self._post({
            "action": "delete",
            "sheet":  "accounts",
            "id":     account_id,
        })
        return True

    # def get_categories(self):   return self._get("categories")
    # def save_category(self, c): return self._post({"action":"upsert","sheet":"categories","row":c})
    # def get_transactions(self): return self._get("transactions")
    # def save_transaction(self,t):return self._post({"action":"upsert","sheet":"transactions","row":t})