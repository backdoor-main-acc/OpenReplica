from pydantic import BaseModel, Field

from app.core.logger import openreplica_logger as logger
from app.events.action import (
    Action,
    ChangeAgentStateAction,
    MessageAction,
    NullAction,
)
from app.events.event import EventSource
from app.events.observation import (
    AgentStateChangedObservation,
    NullObservation,
    Observation,
)
from app.events.serialization.event import event_to_dict
from app.security.invariant.nodes import Function, Message, ToolCall, ToolOutput

TraceElement = Message | ToolCall | ToolOutput | Function


def get_next_id(trace: list[TraceElement]) -> str:
    used_ids = [el.id for el in trace if isinstance(el, ToolCall)]
    for i in range(1, len(used_ids) + 2):
        if str(i) not in used_ids:
            return str(i)
    return '1'


def get_last_id(
    trace: list[TraceElement],
) -> str | None:
    for el in reversed(trace):
        if isinstance(el, ToolCall):
            return el.id
    return None


def parse_action(trace: list[TraceElement], action: Action) -> list[TraceElement]:
    next_id = get_next_id(trace)
    inv_trace: list[TraceElement] = []
    if isinstance(action, MessageAction):
        if action.source == EventSource.USER:
            inv_trace.append(Message(role='user', content=action.content))
        else:
            inv_trace.append(Message(role='assistant', content=action.content))
    elif isinstance(action, (NullAction, ChangeAgentStateAction)):
        pass
    elif hasattr(action, 'action') and action.action is not None:
        event_dict = event_to_dict(action)
        args = event_dict.get('args', {})
        thought = args.pop('thought', None)
        function = Function(name=action.action, arguments=args)
        if thought is not None:
            inv_trace.append(Message(role='assistant', content=thought))
        inv_trace.append(ToolCall(id=next_id, type='function', function=function))
    else:
        logger.error(f'Unknown action type: {type(action)}')
    return inv_trace


def parse_observation(
    trace: list[TraceElement], obs: Observation
) -> list[TraceElement]:
    last_id = get_last_id(trace)
    if isinstance(obs, (NullObservation, AgentStateChangedObservation)):
        return []
    elif hasattr(obs, 'content') and obs.content is not None:
        return [ToolOutput(role='tool', content=obs.content, tool_call_id=last_id)]
    else:
        logger.error(f'Unknown observation type: {type(obs)}')
    return []


def parse_element(
    trace: list[TraceElement], element: Action | Observation
) -> list[TraceElement]:
    if isinstance(element, Action):
        return parse_action(trace, element)
    return parse_observation(trace, element)


def parse_trace(trace: list[tuple[Action, Observation]]) -> list[TraceElement]:
    inv_trace: list[TraceElement] = []
    for action, obs in trace:
        inv_trace.extend(parse_action(inv_trace, action))
        inv_trace.extend(parse_observation(inv_trace, obs))
    return inv_trace


class InvariantState(BaseModel):
    trace: list[TraceElement] = Field(default_factory=list)

    def add_action(self, action: Action) -> None:
        self.trace.extend(parse_action(self.trace, action))

    def add_observation(self, obs: Observation) -> None:
        self.trace.extend(parse_observation(self.trace, obs))

    def concatenate(self, other: 'InvariantState') -> None:
        self.trace.extend(other.trace)
