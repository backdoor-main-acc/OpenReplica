from app.agenthub.dummy_agent.agent import DummyAgent
from app.controller.agent import Agent

Agent.register('DummyAgent', DummyAgent)
