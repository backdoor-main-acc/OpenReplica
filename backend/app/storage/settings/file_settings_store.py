from __future__ import annotations

import json
from dataclasses import dataclass

from app.core.config.openreplica_config import OpenReplicaConfig
from app.storage import get_file_store
from app.storage.data_models.settings import Settings
from app.storage.files import FileStore
from app.storage.settings.settings_store import SettingsStore
from app.utils.async_utils import call_sync_from_async


@dataclass
class FileSettingsStore(SettingsStore):
    file_store: FileStore
    path: str = 'settings.json'

    async def load(self) -> Settings | None:
        try:
            json_str = await call_sync_from_async(self.file_store.read, self.path)
            kwargs = json.loads(json_str)
            settings = Settings(**kwargs)
            return settings
        except FileNotFoundError:
            return None

    async def store(self, settings: Settings) -> None:
        json_str = settings.model_dump_json(context={'expose_secrets': True})
        await call_sync_from_async(self.file_store.write, self.path, json_str)

    @classmethod
    async def get_instance(
        cls, config: OpenReplicaConfig, user_id: str | None
    ) -> FileSettingsStore:
        file_store = file_store = get_file_store(
            config.file_store,
            config.file_store_path,
            config.file_store_web_hook_url,
            config.file_store_web_hook_headers
        )
        return FileSettingsStore(file_store)
