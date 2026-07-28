from __future__ import annotations
import uuid
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import get_settings
from app.database import Base, engine, database_ready
from app.api.v1 import router as v1_router
s=get_settings()
if s.auto_create_schema: Base.metadata.create_all(engine)
app=FastAPI(title=s.app_name,version=s.version,description='Bell coaching backend with full orchestration, planning, session selection, adaptive reasoning, athlete memory, simulation, nutrition, competition, and learning engines.')
app.add_middleware(CORSMiddleware,allow_origins=s.cors_origin_list,allow_credentials=True,allow_methods=['*'],allow_headers=['*'],expose_headers=['X-Request-ID'])
@app.middleware('http')
async def request_id(request:Request,call_next):
    rid=request.headers.get('X-Request-ID',uuid.uuid4().hex); request.state.request_id=rid
    response=await call_next(request); response.headers['X-Request-ID']=rid; return response
@app.exception_handler(RequestValidationError)
async def validation_error(request:Request,exc:RequestValidationError):
    return JSONResponse(status_code=422,content={'error':{'code':'validation_error','message':'Request validation failed','details':exc.errors(),'request_id':getattr(request.state,'request_id',None)}})
@app.exception_handler(Exception)
async def unhandled_error(request:Request,exc:Exception):
    return JSONResponse(status_code=500,content={'error':{'code':'internal_error','message':'An unexpected error occurred','request_id':getattr(request.state,'request_id',None)}})
@app.get('/health',tags=['Operations'])
def health(): return {'status':'ok','service':'bell-core','version':s.version,'environment':s.environment}
@app.get('/ready',tags=['Operations'])
def ready():
    ok=database_ready(); return JSONResponse(status_code=200 if ok else 503,content={'status':'ready' if ok else 'not_ready','database':ok})
app.include_router(v1_router)
