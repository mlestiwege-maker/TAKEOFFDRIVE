from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_driver
from app.models.document import Document
from app.models.enums import DocumentType
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.services import driver_service
from app.services.document_service import DocumentError, delete_document, read_document_bytes, save_document

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("", response_model=list[DocumentResponse])
def list_documents(current_user: User = Depends(require_driver), db: Session = Depends(get_db)):
    driver = driver_service.get_or_create_driver(db, current_user)
    return driver.documents


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    document_type: DocumentType = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = driver_service.get_or_create_driver(db, current_user)
    contents = await file.read()
    try:
        document = save_document(db, driver, document_type, file, contents)
    except DocumentError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return document


@router.get("/{document_id}/file")
def download_document(
    document_id: int, current_user: User = Depends(require_driver), db: Session = Depends(get_db)
):
    driver = driver_service.get_or_create_driver(db, current_user)
    document = db.query(Document).filter(Document.id == document_id, Document.driver_id == driver.id).first()
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    contents = read_document_bytes(document)
    return Response(
        content=contents,
        media_type=document.content_type,
        headers={"Content-Disposition": f'inline; filename="{document.file_name}"'},
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_document(
    document_id: int, current_user: User = Depends(require_driver), db: Session = Depends(get_db)
):
    driver = driver_service.get_or_create_driver(db, current_user)
    document = db.query(Document).filter(Document.id == document_id, Document.driver_id == driver.id).first()
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    delete_document(db, document)
