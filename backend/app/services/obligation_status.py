from app.core.errors import AppError
from app.models import Obligation, ObligationStatus


class InvalidStatusTransition(AppError):
    code = "INVALID_STATUS_TRANSITION"
    status_code = 409

    def __init__(self, current: ObligationStatus, target: ObligationStatus):
        super().__init__({"current": current.value, "target": target.value})


class DocumentRequired(AppError):
    code = "DOCUMENT_REQUIRED"
    status_code = 409


class ObligationStatusService:
    # Allowed forward transitions of the obligation lifecycle.
    ALLOWED_TRANSITIONS: dict[ObligationStatus, set[ObligationStatus]] = {
        ObligationStatus.pending: {ObligationStatus.in_progress},
        ObligationStatus.in_progress: {ObligationStatus.submitted, ObligationStatus.pending},
        ObligationStatus.submitted: {ObligationStatus.done, ObligationStatus.in_progress},
        ObligationStatus.done: set(),
    }

    @classmethod
    def can_transition(
        cls, current: ObligationStatus, target: ObligationStatus
    ) -> bool:
        return target in cls.ALLOWED_TRANSITIONS.get(current, set())

    @classmethod
    def validate(cls, obligation: Obligation, target: ObligationStatus) -> None:
        if not cls.can_transition(obligation.status, target):
            raise InvalidStatusTransition(obligation.status, target)
        if (
            target == ObligationStatus.submitted
            and obligation.requires_document
            and not obligation.document_path
        ):
            raise DocumentRequired()

    @classmethod
    def apply(cls, obligation: Obligation, target: ObligationStatus) -> None:
        cls.validate(obligation, target)
        obligation.status = target
