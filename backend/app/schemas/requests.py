from datetime import date

from pydantic import BaseModel

from app.models import ObligationStatus, ObligationType
from app.schemas.base import ObligationBase


class ObligationCreate(ObligationBase):
    company_tax_id: str  # SENSITIVE — accepted on write


class ObligationUpdate(BaseModel):
    # status + company_tax_id intentionally not editable
    type: ObligationType | None = None
    title: str | None = None
    description: str | None = None
    due_date: date | None = None
    owner: str | None = None
    requires_document: bool | None = None
    document_path: str | None = None


class ObligationStatusUpdate(BaseModel):
    status: ObligationStatus
    # Optional optimistic-lock precondition. When set, the row's current
    # version must match or the change is rejected with 409.
    expected_version: int | None = None
