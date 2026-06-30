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
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import ObligationStatus, ObligationType


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
    # Optimistic-lock counter. SQLAlchemy bumps it on every UPDATE and adds
    # `WHERE version = :old`, so a concurrent writer that read the same row
    # loses with StaleDataError instead of silently overwriting it.
    version = Column(Integer, nullable=False, default=1)

    __mapper_args__ = {"version_id_col": version}

    status_history: Mapped[list["ObligationStatusHistory"]] = relationship(
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
