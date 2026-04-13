from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_cargo
from app.models.processo import Processo
from app.schemas.processo import ProcessoResponse

router = APIRouter()

CARGOS = ["Master", "Compras", "Mestre", "Encarregado"]


@router.get("/", response_model=list[ProcessoResponse])
async def listar_processos(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    q = select(Processo)
    if status:
        q = q.where(Processo.status == status)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{processo_id}", response_model=ProcessoResponse)
async def buscar_processo(
    processo_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    p = await db.get(Processo, processo_id)
    if not p:
        raise HTTPException(404, "Processo nao encontrado")
    return p
