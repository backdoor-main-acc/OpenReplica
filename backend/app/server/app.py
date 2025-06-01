import warnings
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi.routing import Mount

with warnings.catch_warnings():
    warnings.simplefilter('ignore')

from fastapi import (
    FastAPI,
)

import app.agenthub  # noqa F401 (we import this to get the agents registered)
from app import __version__
from app.server.routes.conversation import app as conversation_api_router
from app.server.routes.feedback import app as feedback_api_router
from app.server.routes.files import app as files_api_router
from app.server.routes.git import app as git_api_router
from app.server.routes.health import add_health_endpoints
from app.server.routes.manage_conversations import (
    app as manage_conversation_api_router,
)
from app.server.routes.mcp import mcp_server
from app.server.routes.public import app as public_api_router
from app.server.routes.secrets import app as secrets_router
from app.server.routes.security import app as security_api_router
from app.server.routes.settings import app as settings_router
from app.server.routes.trajectory import app as trajectory_router

# Enhanced OpenReplica custom routes
from app.server.routes.agents import app as agents_api_router
from app.server.routes.microagents import app as microagents_api_router
from app.server.routes.sessions import app as sessions_api_router
from app.server.routes.websocket_routes import app as websocket_api_router

from app.server.shared import conversation_manager


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncIterator[None]:
    async with conversation_manager:
        yield


app = FastAPI(
    title='OpenReplica',
    description='OpenReplica: Code Less, Make More - Enhanced OpenHands with Custom Features',
    version=__version__,
    lifespan=_lifespan,
    routes=[Mount(path='/mcp', app=mcp_server.sse_app())],
)

# Core OpenHands routes
app.include_router(public_api_router)
app.include_router(files_api_router)
app.include_router(security_api_router)
app.include_router(feedback_api_router)
app.include_router(conversation_api_router)
app.include_router(manage_conversation_api_router)
app.include_router(settings_router)
app.include_router(secrets_router)
app.include_router(git_api_router)
app.include_router(trajectory_router)

# Enhanced OpenReplica custom routes
app.include_router(agents_api_router)
app.include_router(microagents_api_router)
app.include_router(sessions_api_router)
app.include_router(websocket_api_router)

add_health_endpoints(app)
