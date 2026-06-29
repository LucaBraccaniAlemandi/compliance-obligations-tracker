from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import StaleDataError

from app import models, schemas
from app.core.database import get_db
from app.core.errors import NotFoundError
from app.services.obligation_status import (
    ConcurrentModification,
    ObligationStatusService,
)

router = APIRouter(prefix="/obligations", tags=["obligations"])


def _get_or_404(db: Session, obligation_id: int) -> models.Obligation:
    obligation = db.get(models.Obligation, obligation_id)
    if obligation is None:
        raise NotFoundError({"resource": "obligation", "id": obligation_id})
    return obligation


@router.post("", response_model=schemas.ObligationRead, status_code=201)
def create_obligation(payload: schemas.ObligationCreate, db: Session = Depends(get_db)):
    obligation = models.Obligation(**payload.model_dump())
    db.add(obligation)
    db.commit()
    db.refresh(obligation)
    return obligation


@router.get("", response_model=list[schemas.ObligationRead])
def list_obligations(db: Session = Depends(get_db)):
    return db.query(models.Obligation).all()


@router.get("/{obligation_id}", response_model=schemas.ObligationDetailRead)
def get_obligation(obligation_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, obligation_id)


@router.patch("/{obligation_id}", response_model=schemas.ObligationRead)
def update_obligation(
    obligation_id: int,
    payload: schemas.ObligationUpdate,
    db: Session = Depends(get_db),
):
    obligation = _get_or_404(db, obligation_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(obligation, field, value)
    db.commit()
    db.refresh(obligation)
    return obligation


@router.patch("/{obligation_id}/status", response_model=schemas.ObligationRead)
def update_obligation_status(
    obligation_id: int,
    payload: schemas.ObligationStatusUpdate,
    db: Session = Depends(get_db),
):
    obligation = _get_or_404(db, obligation_id)
    # Client precondition: reject fast if the caller acted on a stale view.
    if (
        payload.expected_version is not None
        and payload.expected_version != obligation.version
    ):
        raise ConcurrentModification(payload.expected_version, obligation.version)
    ObligationStatusService.apply(obligation, payload.status)
    try:
        db.commit()
    except StaleDataError:
        # DB backstop: another writer bumped the version between our read and
        # commit. version_id_col's UPDATE matched 0 rows.
        db.rollback()
        raise ConcurrentModification(
            payload.expected_version or obligation.version, obligation.version
        )
    db.refresh(obligation)
    return obligation


@router.delete("/{obligation_id}", status_code=204)
def delete_obligation(obligation_id: int, db: Session = Depends(get_db)):
    obligation = _get_or_404(db, obligation_id)
    db.delete(obligation)
    db.commit()
    return Response(status_code=204)
