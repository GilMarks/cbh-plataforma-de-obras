from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_cargo
from app.models.banco import Banco
from app.schemas.banco import BancoCreate, BancoResponse, BancoUpdate

router = APIRouter()

CARGOS = ["Master", "Financeiro"]


@router.get("", response_model=list[BancoResponse])
async def listar_bancos(
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    result = await db.execute(select(Banco))
    return result.scalars().all()


@router.get("/{banco_id}", response_model=BancoResponse)
async def buscar_banco(
    banco_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    b = await db.get(Banco, banco_id)
    if not b:
        raise HTTPException(404, "Banco nao encontrado")
    return b


@router.post("", response_model=BancoResponse)
async def criar_banco(
    body: BancoCreate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    b = Banco(**body.model_dump())
    db.add(b)
    await db.commit()
    await db.refresh(b)
    return b


@router.put("/{banco_id}", response_model=BancoResponse)
async def atualizar_banco(
    banco_id: int,
    body: BancoUpdate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    b = await db.get(Banco, banco_id)
    if not b:
        raise HTTPException(404, "Banco nao encontrado")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(b, k, v)
    await db.commit()
    await db.refresh(b)
    return b


@router.delete("/{banco_id}")
async def remover_banco(
    banco_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    b = await db.get(Banco, banco_id)
    if not b:
        raise HTTPException(404, "Banco nao encontrado")
    await db.delete(b)
    await db.commit()
    return {"ok": True}
