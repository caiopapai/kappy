from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.utils import is_intent_name, is_request_type


class FallbackIntentHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return is_intent_name("AMAZON.FallbackIntent")(handler_input)

    def handle(self, handler_input):
        speak = (
            "Não percebi. "
            "Podes dizer: criar uma conta, actualizar o saldo, "
            "apagar uma conta, ou listar as contas."
        )
        return (
            handler_input.response_builder
                .speak(speak)
                .ask("O que queres fazer?")
                .response
        )


class SessionEndedRequestHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return is_request_type("SessionEndedRequest")(handler_input)

    def handle(self, handler_input):
        # Limpeza de sessão se necessário
        return handler_input.response_builder.response