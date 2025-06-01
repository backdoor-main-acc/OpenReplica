from app.agenthub.codeact_agent.codeact_agent import CodeActAgent
from app.controller.agent import Agent

Agent.register('CodeActAgent', CodeActAgent)
