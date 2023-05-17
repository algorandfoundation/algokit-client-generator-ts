import logging

from .helloworld import helloworld
from .lifecycle import lifecycle
from .state import state
from .voting import voting

logger = logging.getLogger(__name__)

# define example contracts to build
contracts = [helloworld.app, lifecycle.app, state.app, voting.app]
