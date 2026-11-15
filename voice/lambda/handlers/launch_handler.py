from ask_sdk_core.dispatch_components import AbstractRequestHandler
import ask_sdk_core.utils as ask_utils


class LaunchRequestHandler(AbstractRequestHandler):
    """Abre a skill e dá as boas-vindas."""

    def can_handle(self, handler_input):
        return ask_utils.is_request_type("LaunchRequest")(handler_input)

    def handle(self, handler_input):
        speak = (
            "Bem-vindo ao Kappy, o teu gestor financeiro pessoal. "
            "Podes criar, actualizar ou apagar contas, ou pedir a lista das tuas contas. "
            "O que queres fazer?"
        )
        reprompt = "O que queres fazer? Podes dizer, por exemplo, criar uma conta."

        return (
            handler_input.response_builder
                .speak(speak)
                .ask(reprompt)
                .response
        )