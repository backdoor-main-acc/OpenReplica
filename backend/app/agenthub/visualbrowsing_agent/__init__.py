from app.agenthub.visualbrowsing_agent.visualbrowsing_agent import (
    VisualBrowsingAgent,
)
from app.controller.agent import Agent

Agent.register('VisualBrowsingAgent', VisualBrowsingAgent)
