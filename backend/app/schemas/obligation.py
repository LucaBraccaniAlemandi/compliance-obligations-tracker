from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, computed_field, field_serializer

from app.models import ObligationStatus, ObligationType


class ObligationBase(BaseModel):
    type: ObligationType
    title: str
    description: str | None = None
    due_date: date | None = None
    owner: str
    requires_document: bool = False
    document_path: str | None = None


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


class ObligationRead(ObligationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: ObligationStatus
    created_at: datetime
    company_tax_id: str  # SENSITIVE — masked on read

    @field_serializer("company_tax_id")
    def mask_tax_id(self, value: str) -> str:
        return f"****{value[-4:]}" if value and len(value) >= 4 else "****"

    @computed_field
    @property
    def overdue(self) -> bool:
        # derived: due date passed and not yet closed
        if self.due_date is None:
            return False
        if self.status in (ObligationStatus.submitted, ObligationStatus.done):
            return False
        return self.due_date < date.today()
