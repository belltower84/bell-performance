from fastapi import APIRouter
from .auth import router as auth_router
from .routes import router as domain_router
router=APIRouter(prefix='/api/v1'); router.include_router(auth_router); router.include_router(domain_router)
