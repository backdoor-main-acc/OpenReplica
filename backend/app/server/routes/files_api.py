"""
File operations API with real file system integration
"""
import os
import mimetypes
import shutil
from pathlib import Path
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


def get_workspace_path(session_id: str) -> Path:
    """Get the workspace directory for a session"""
    workspace_dir = Path(f"/tmp/openreplica_workspace/{session_id}")
    workspace_dir.mkdir(parents=True, exist_ok=True)
    return workspace_dir


@router.get("/{session_id}/list")
async def list_files(session_id: str, path: str = "") -> DirectoryListing:
    """List files in session workspace"""
    workspace_dir = get_workspace_path(session_id)
    target_dir = workspace_dir / path if path else workspace_dir
    
    if not target_dir.exists():
        # Create the directory if it doesn't exist
        target_dir.mkdir(parents=True, exist_ok=True)
    
    if not target_dir.is_dir():
        raise HTTPException(status_code=400, detail="Path is not a directory")
    
    files = []
    total_size = 0
    
    try:
        for item in target_dir.iterdir():
            try:
                stat = item.stat()
                size = stat.st_size if item.is_file() else 0
                mime_type = mimetypes.guess_type(str(item))[0] if item.is_file() else None
                
                relative_path = str(item.relative_to(workspace_dir))
                
                files.append(FileInfo(
                    name=item.name,
                    path=relative_path,
                    size=size,
                    modified=int(stat.st_mtime * 1000),  # Convert to milliseconds
                    is_directory=item.is_dir(),
                    mime_type=mime_type
                ))
                total_size += size
            except (OSError, ValueError) as e:
                logger.warning(f"Skipping file {item}: {e}")
                continue
                
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except Exception as e:
        logger.error(f"Error listing files in {target_dir}: {e}")
        raise HTTPException(status_code=500, detail="Error listing files")
    
    # Sort: directories first, then files, both alphabetically
    files.sort(key=lambda x: (not x.is_directory, x.name.lower()))
    
    return DirectoryListing(
        path=path,
        files=files,
        total_files=len(files),
        total_size=total_size
    )


@router.get("/{session_id}/read")
async def read_file(session_id: str, path: str) -> FileContent:
    """Read file content"""
    workspace_dir = get_workspace_path(session_id)
    file_path = workspace_dir / path
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    if not file_path.is_file():
        raise HTTPException(status_code=400, detail="Path is not a file")
    
    # Security check: ensure file is within workspace
    try:
        file_path.resolve().relative_to(workspace_dir.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Try to read as text first
        encoding = 'utf-8'
        try:
            content = file_path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            # If UTF-8 fails, try with latin-1
            encoding = 'latin-1'
            content = file_path.read_text(encoding=encoding)
        
        return FileContent(
            path=path,
            content=content,
            encoding=encoding,
            size=file_path.stat().st_size
        )
    except Exception as e:
        logger.error(f"Error reading file {file_path}: {e}")
        raise HTTPException(status_code=500, detail="Error reading file")


@router.post("/{session_id}/write")
async def write_file(session_id: str, request: WriteFileRequest) -> Dict[str, Any]:
    """Write file content"""
    workspace_dir = get_workspace_path(session_id)
    file_path = workspace_dir / request.path
    
    # Security check: ensure file is within workspace
    try:
        file_path.resolve().parent.relative_to(workspace_dir.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Create parent directories if they don't exist
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write the file
        file_path.write_text(request.content, encoding=request.encoding)
        
        logger.info(f"Wrote file {request.path} in session {session_id}")
        
        return {
            "success": True,
            "path": request.path,
            "size": len(request.content.encode(request.encoding)),
            "session_id": session_id
        }
    except Exception as e:
        logger.error(f"Error writing file {file_path}: {e}")
        raise HTTPException(status_code=500, detail="Error writing file")


@router.delete("/{session_id}/delete")
async def delete_file(session_id: str, path: str) -> Dict[str, Any]:
    """Delete file or directory"""
    workspace_dir = get_workspace_path(session_id)
    target_path = workspace_dir / path
    
    if not target_path.exists():
        raise HTTPException(status_code=404, detail="File or directory not found")
    
    # Security check: ensure path is within workspace
    try:
        target_path.resolve().relative_to(workspace_dir.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        if target_path.is_file():
            target_path.unlink()
        elif target_path.is_dir():
            shutil.rmtree(target_path)
        else:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        logger.info(f"Deleted {path} in session {session_id}")
        
        return {
            "success": True,
            "path": path,
            "session_id": session_id
        }
    except Exception as e:
        logger.error(f"Error deleting {target_path}: {e}")
        raise HTTPException(status_code=500, detail="Error deleting file")


@router.post("/{session_id}/upload")
async def upload_file(
    session_id: str,
    file: UploadFile = File(...),
    path: str = ""
) -> Dict[str, Any]:
    """Upload file"""
    workspace_dir = get_workspace_path(session_id)
    
    # Determine target path
    if path:
        target_dir = workspace_dir / path
        target_file = target_dir / file.filename
    else:
        target_file = workspace_dir / file.filename
    
    # Security check: ensure file is within workspace
    try:
        target_file.resolve().relative_to(workspace_dir.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Create parent directories if they don't exist
        target_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Write uploaded file
        content = await file.read()
        target_file.write_bytes(content)
        
        logger.info(f"Uploaded file {file.filename} to {path} in session {session_id}")
        
        return {
            "success": True,
            "filename": file.filename,
            "path": str(target_file.relative_to(workspace_dir)),
            "size": len(content),
            "session_id": session_id
        }
    except Exception as e:
        logger.error(f"Error uploading file {file.filename}: {e}")
        raise HTTPException(status_code=500, detail="Error uploading file")


@router.post("/{session_id}/create-directory")
async def create_directory(session_id: str, path: str) -> Dict[str, Any]:
    """Create directory"""
    workspace_dir = get_workspace_path(session_id)
    target_dir = workspace_dir / path
    
    # Security check: ensure directory is within workspace
    try:
        target_dir.resolve().relative_to(workspace_dir.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        target_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Created directory {path} in session {session_id}")
        
        return {
            "success": True,
            "path": path,
            "session_id": session_id
        }
    except Exception as e:
        logger.error(f"Error creating directory {target_dir}: {e}")
        raise HTTPException(status_code=500, detail="Error creating directory")


# Export router as app for consistency
app = router
