from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, computed_field, field_serializer

from app.models import ObligationStatus
from app.schemas.base import ObligationBase


class ObligationStatusHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    from_status: ObligationStatus
    to_status: ObligationStatus
    changed_at: datetime


class ObligationKpis(BaseModel):
    total: int
    by_status: dict[ObligationStatus, int]
    overdue: int


class ObligationRead(ObligationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: ObligationStatus
    version: int  # optimistic-lock counter; echo back as expected_version
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


class ObligationDetailRead(ObligationRead):
    status_history: list[ObligationStatusHistoryRead] = []
