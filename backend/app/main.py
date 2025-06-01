"""
OpenReplica - Enhanced OpenHands Backend
A complete replica of OpenHands with enhanced custom features
"""
import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import warnings

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.routing import Mount
import socketio

# Import agenthub to register agents
import app.agenthub  # noqa F401

from app import __version__
from app.core.config import get_settings
from app.core.logging import setup_logging

# Core OpenHands routes
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

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Global instances for enhanced features
sio_server = None
socket_manager = None
conversation_storage = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager with enhanced features"""
    global sio_server, socket_manager, conversation_storage
    
    logger.info("Starting OpenReplica backend...")
    
    # Initialize settings
    settings = get_settings()
    
    # Initialize OpenHands conversation manager
    async with conversation_manager:
        # Initialize custom storage if available
        try:
            from app.storage.conversation import ConversationStorage
            conversation_storage = ConversationStorage()
            await conversation_storage.initialize()
            logger.info("Custom conversation storage initialized")
        except ImportError:
            logger.info("Using default OpenHands storage")
        
        # Initialize Socket.IO for enhanced features
        try:
            sio_server = socketio.AsyncServer(
                cors_allowed_origins="*",
                logger=True,
                engineio_logger=True,
            )
            
            # Initialize socket manager if available
            from app.server.websocket.manager import SocketManager
            socket_manager = SocketManager(sio_server)
            logger.info("Enhanced WebSocket features initialized")
        except ImportError:
            logger.info("Using default OpenHands WebSocket handling")
        
        logger.info("OpenReplica backend started successfully")
        
        yield
        
        # Cleanup
        logger.info("Shutting down OpenReplica backend...")
        if conversation_storage:
            await conversation_storage.close()


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    
    with warnings.catch_warnings():
        warnings.simplefilter('ignore')
    
    settings = get_settings()
    
    app = FastAPI(
        title="OpenReplica",
        description="OpenReplica: Code Less, Make More - Enhanced OpenHands with Custom Features",
        version=__version__,
        lifespan=lifespan,
        routes=[Mount(path='/mcp', app=mcp_server.sse_app())],
    )
    
    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Core OpenHands routes
    app.include_router(public_api_router)
    app.include_router(files_api_router)
    app.include_router(security_api_router)
    app.include_router(feedback_api_router)
    app.include_router(conversation_api_router)
    app.include_router(manage_conversation_api_router)
    app.include_router(settings_router)
    app.include_router(git_api_router)
    app.include_router(trajectory_router)
    
    # Enhanced OpenReplica custom routes
    app.include_router(agents_api_router)
    app.include_router(microagents_api_router)
    app.include_router(sessions_api_router)
    app.include_router(websocket_api_router)
    
    # Add health endpoints
    add_health_endpoints(app)
    
    return app


# Create the application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=getattr(settings, 'host', '0.0.0.0'),
        port=getattr(settings, 'port', 8000),
        reload=getattr(settings, 'debug', False),
        log_level="debug" if getattr(settings, 'debug', False) else "info",
    )
