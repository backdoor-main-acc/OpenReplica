from dataclasses import dataclass

from app.events.event import Event


@dataclass
class Observation(Event):
    content: str
