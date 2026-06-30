from datetime import date

from pydantic import BaseModel

from app.models import ObligationType


class ObligationBase(BaseModel):
    type: ObligationType
    title: str
    description: str | None = None
    due_date: date | None = None
    owner: str
    requires_document: bool = False
    document_path: str | None = None
