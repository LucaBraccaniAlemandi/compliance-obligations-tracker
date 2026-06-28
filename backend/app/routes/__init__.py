from fastapi import APIRouter

from app.routes.obligations import router as obligation_router

api_router = APIRouter(prefix="/api")
api_router.include_router(obligation_router)

__all__ = ["api_router"]
