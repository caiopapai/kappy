import logging
import ask_sdk_core.utils as ask_utils

from ask_sdk_core.skill_builder import SkillBuilder
from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.dispatch_components import AbstractExceptionHandler

from handlers.launch_handler import LaunchRequestHandler
from handlers.accounts_handler import (
    CreateAccountIntentHandler,
    UpdateAccountIntentHandler,
    DeleteAccountIntentHandler,
    ListAccountsIntentHandler,
)
from handlers.help_handler import HelpIntentHandler, CancelAndStopIntentHandler
from handlers.fallback_handler import FallbackIntentHandler, SessionEndedRequestHandler

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
──
sb = SkillBuilder()

sb.add_request_handler(LaunchRequestHandler())
sb.add_request_handler(CreateAccountIntentHandler())
sb.add_request_handler(UpdateAccountIntentHandler())
sb.add_request_handler(DeleteAccountIntentHandler())
sb.add_request_handler(ListAccountsIntentHandler())
sb.add_request_handler(HelpIntentHandler())
sb.add_request_handler(CancelAndStopIntentHandler())
sb.add_request_handler(FallbackIntentHandler())
sb.add_request_handler(SessionEndedRequestHandler())

class CatchAllExceptionHandler(AbstractExceptionHandler):
    def can_handle(self, handler_input, exception):
        return True

    def handle(self, handler_input, exception):
        logger.error(exception, exc_info=True)
        speak = "Ocorreu um erro no Kappy. Tenta novamente."
        return (
            handler_input.response_builder
                .speak(speak)
                .ask(speak)
                .response
        )

sb.add_exception_handler(CatchAllExceptionHandler())

lambda_handler = sb.lambda_handler()