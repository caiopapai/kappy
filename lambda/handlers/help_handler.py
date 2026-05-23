from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.utils import is_intent_name, is_request_type


class HelpIntentHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return is_intent_name("AMAZON.HelpIntent")(handler_input)

    def handle(self, handler_input):
        speak = (
            "Com o Kappy podes gerir as tuas contas financeiras por voz. "
            "Podes dizer: criar uma conta, actualizar o saldo de uma conta, "
            "apagar uma conta, ou listar as minhas contas. "
            "O que queres fazer?"
        )
        return (
            handler_input.response_builder
                .speak(speak)
                .ask("O que queres fazer?")
                .response
        )


class CancelAndStopIntentHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return (
            is_intent_name("AMAZON.CancelIntent")(handler_input)
            or is_intent_name("AMAZON.StopIntent")(handler_input)
        )

    def handle(self, handler_input):
        return (
            handler_input.response_builder
                .speak("Até logo! O Kappy está sempre aqui quando precisares.")
                .response
        )