from datetime import datetime

from pydantic import ConfigDict, BaseModel

from app.models.enums import DocumentStatus, DocumentType


class DocumentResponse(BaseModel):
    id: int
    driver_id: int
    document_type: DocumentType
    file_name: str
    file_url: str
    content_type: str
    size_bytes: int
    status: DocumentStatus
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)
