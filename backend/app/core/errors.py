import logging
from typing import Any

from fastapi import Request
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Base app error. Carries a machine code + params for i18n on the client.

    The frontend maps `code` to a translated message and interpolates `params`.
    No human-readable text is sent from the backend.
    """

    code: str = "INTERNAL_ERROR"
    status_code: int = 400

    def __init__(self, params: dict[str, Any] | None = None):
        self.params = params or {}
        super().__init__(self.code)

    def to_dict(self) -> dict[str, Any]:
        return {"error": {"code": self.code, "params": self.params}}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=exc.to_dict())

    @app.exception_handler(RequestValidationError)
    async def _handle_validation(
        _: Request, exc: RequestValidationError
    ) -> JSONResponse:
        # normalize Pydantic errors into the same envelope.
        # per-field so the client can translate by `type` and mark fields.
        fields = [
            {
                "field": ".".join(str(p) for p in err["loc"] if p != "body"),
                "type": err["type"],
            }
            for err in exc.errors()
        ]
        body = {"error": {"code": "VALIDATION_ERROR", "params": {"fields": fields}}}
        return JSONResponse(status_code=422, content=body)

    @app.exception_handler(StarletteHTTPException)
    async def _handle_http(
        _: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        # routing 404s, FastAPI internals — normalize to the envelope.
        body = {"error": {"code": "HTTP_ERROR", "params": {"status": exc.status_code}}}
        return JSONResponse(status_code=exc.status_code, content=body)

    @app.exception_handler(Exception)
    async def _handle_unexpected(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error: %s", exc)
        body = {"error": {"code": "INTERNAL_ERROR", "params": {}}}
        return JSONResponse(status_code=500, content=body)
