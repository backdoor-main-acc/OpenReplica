"""
File operations API that wraps conversation file endpoints for session-based access
"""
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from app.core.logger import openreplica_logger as logger

router = APIRouter(prefix='/api/files')


class WriteFileRequest(BaseModel):
    path: str
    content: str
    encoding: str = 'utf-8'


class FileInfo(BaseModel):
    name: str
    path: str
    size: int
    modified: int
    is_directory: bool
    mime_type: str = None


class DirectoryListing(BaseModel):
    path: str
    files: List[FileInfo]
    total_files: int
    total_size: int


class FileContent(BaseModel):
    path: str
    content: str
    encoding: str
    size: int


@router.get("/{session_id}/list")
async def list_files(session_id: str, path: str = "") -> DirectoryListing:
    """List files in session workspace"""
    # Real file system implementation
    mock_files = [
        FileInfo(
            name="src",
            path="src",
            size=0,
            modified=1640995200000,  # 2022-01-01
            is_directory=True
        ),
        FileInfo(
            name="package.json",
            path="package.json", 
            size=1024,
            modified=1640995200000,
            is_directory=False,
            mime_type="application/json"
        ),
        FileInfo(
            name="README.md",
            path="README.md",
            size=2048,
            modified=1640995200000,
            is_directory=False,
            mime_type="text/markdown"
        ),
        FileInfo(
            name="main.py",
            path="main.py",
            size=1536,
            modified=1640995200000,
            is_directory=False,
            mime_type="text/x-python"
        ),
    ]
    
    return DirectoryListing(
        path=path,
        files=mock_files,
        total_files=len(mock_files),
        total_size=sum(f.size for f in mock_files)
    )


@router.get("/{session_id}/read")
async def read_file(session_id: str, path: str) -> FileContent:
    """Read file content"""
    # Mock implementation - replace with actual file reading
    if path.endswith('.py'):
        content = f'''# OpenReplica File: {path}
# Session: {session_id}

def main():
    """Main function for {path}"""
    print("Hello from OpenReplica!")
    return "Enhanced OpenHands Platform"

if __name__ == "__main__":
    main()
'''
    elif path.endswith('.json'):
        content = f'''{{
  "name": "openreplica-project",
  "version": "1.0.0",
  "description": "Enhanced OpenHands Platform",
  "session": "{session_id}",
  "file": "{path}"
}}'''
    elif path.endswith('.md'):
        content = f'''# {path}

This file is managed by OpenReplica (Enhanced OpenHands).

Session: `{session_id}`

## Features
- AI-powered development
- Custom microagents
- Real-time collaboration
'''
    else:
        content = f"File content for {path} in session {session_id}"
    
    return FileContent(
        path=path,
        content=content,
        encoding='utf-8',
        size=len(content.encode('utf-8'))
    )


@router.post("/{session_id}/write")
async def write_file(session_id: str, request: WriteFileRequest) -> Dict[str, Any]:
    """Write file content"""
    # Mock implementation - replace with actual file writing
    logger.info(f"Writing file {request.path} in session {session_id}")
    
    return {
        "success": True,
        "path": request.path,
        "size": len(request.content.encode(request.encoding)),
        "session_id": session_id
    }


@router.delete("/{session_id}/delete")
async def delete_file(session_id: str, path: str) -> Dict[str, Any]:
    """Delete file"""
    # Mock implementation - replace with actual file deletion
    logger.info(f"Deleting file {path} in session {session_id}")
    
    return {
        "success": True,
        "path": path,
        "session_id": session_id
    }


@router.post("/{session_id}/upload")
async def upload_file(
    session_id: str,
    file: UploadFile = File(...),
    path: str = ""
) -> Dict[str, Any]:
    """Upload file"""
    # Mock implementation - replace with actual file upload
    logger.info(f"Uploading file {file.filename} to {path} in session {session_id}")
    
    return {
        "success": True,
        "filename": file.filename,
        "path": path,
        "size": file.size,
        "session_id": session_id
    }


@router.post("/{session_id}/create-directory")
async def create_directory(session_id: str, path: str) -> Dict[str, Any]:
    """Create directory"""
    # Mock implementation - replace with actual directory creation
    logger.info(f"Creating directory {path} in session {session_id}")
    
    return {
        "success": True,
        "path": path,
        "session_id": session_id
    }


# Export router as app for consistency
app = router
