import enum

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ObligationType(str, enum.Enum):
    annual_report = "annual_report"
    franchise_tax = "franchise_tax"
    boi_report = "boi_report"
    registered_agent_renewal = "registered_agent_renewal"


class ObligationStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    submitted = "submitted"
    done = "done"


class Obligation(Base):
    __tablename__ = "obligations"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(ObligationType), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(
        Enum(ObligationStatus), default=ObligationStatus.pending, nullable=False
    )
    due_date = Column(Date, nullable=True)
    owner = Column(String(255), nullable=False)
    requires_document = Column(Boolean, default=False, nullable=False)
    document_path = Column(String(512), nullable=True)
    company_tax_id = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    status_history = relationship(
        "ObligationStatusHistory",
        back_populates="obligation",
        order_by="ObligationStatusHistory.changed_at",
        cascade="all, delete-orphan",
    )


class ObligationStatusHistory(Base):
    __tablename__ = "obligation_status_history"

    id = Column(Integer, primary_key=True, index=True)
    obligation_id = Column(
        Integer,
        ForeignKey("obligations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_status = Column(Enum(ObligationStatus), nullable=False)
    to_status = Column(Enum(ObligationStatus), nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())

    obligation = relationship("Obligation", back_populates="status_history")
