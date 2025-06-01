from app.agenthub.readonly_agent.readonly_agent import ReadOnlyAgent
from app.controller.agent import Agent

Agent.register('ReadOnlyAgent', ReadOnlyAgent)
