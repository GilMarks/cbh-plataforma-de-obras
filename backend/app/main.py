from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import async_session, engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with async_session() as db:
        from app.seed import seed_database
        await seed_database(db)
    yield


app = FastAPI(title="CBH Plataforma de Obras API", version="1.0.0", lifespan=lifespan, redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


# Routers
from app.routers import (
    auth,
    usuarios,
    obras,
    solicitacoes,
    fabrica,
    carregamentos,
    montagens,
    autorizacao,
    solicitacoes_compra,
    processos,
    lancamentos,
    bancos,
    insumos,
    fornecedores,
    movimentacoes_estoque,
    ferramentas,
    funcionarios_rh,
    dashboard,
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(usuarios.router, prefix="/api/usuarios", tags=["usuarios"])
app.include_router(obras.router, prefix="/api/obras", tags=["obras"])
app.include_router(solicitacoes.router, prefix="/api/solicitacoes", tags=["solicitacoes"])
app.include_router(fabrica.router, prefix="/api/fabrica", tags=["fabrica"])
app.include_router(carregamentos.router, prefix="/api/carregamentos", tags=["carregamentos"])
app.include_router(montagens.router, prefix="/api/montagens", tags=["montagens"])
app.include_router(autorizacao.router, prefix="/api/autorizacao", tags=["autorizacao"])
app.include_router(solicitacoes_compra.router, prefix="/api/solicitacoes-compra", tags=["solicitacoes_compra"])
app.include_router(processos.router, prefix="/api/processos", tags=["processos"])
app.include_router(lancamentos.router, prefix="/api/lancamentos", tags=["lancamentos"])
app.include_router(bancos.router, prefix="/api/bancos", tags=["bancos"])
app.include_router(insumos.router, prefix="/api/insumos", tags=["insumos"])
app.include_router(fornecedores.router, prefix="/api/fornecedores", tags=["fornecedores"])
app.include_router(movimentacoes_estoque.router, prefix="/api/movimentacoes-estoque", tags=["movimentacoes_estoque"])
app.include_router(ferramentas.router, prefix="/api/ferramentas", tags=["ferramentas"])
app.include_router(funcionarios_rh.router, prefix="/api/funcionarios-rh", tags=["funcionarios_rh"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
