from app.core.errors import AppError
from app.models import ObligationStatus


class NotFoundError(AppError):
    code = "NOT_FOUND"
    status_code = 404


class InvalidStatusTransition(AppError):
    code = "INVALID_STATUS_TRANSITION"
    status_code = 409

    def __init__(self, current: ObligationStatus, target: ObligationStatus):
        super().__init__({"current": current.value, "target": target.value})


class DocumentRequired(AppError):
    code = "DOCUMENT_REQUIRED"
    status_code = 409


class ConcurrentModification(AppError):
    code = "CONCURRENT_MODIFICATION"
    status_code = 409

    def __init__(self, expected: int, current: int):
        super().__init__({"expected": expected, "current": current})
