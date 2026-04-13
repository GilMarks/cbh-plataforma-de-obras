from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_cargo
from app.models.fornecedor import Fornecedor
from app.schemas.fornecedor import FornecedorCreate, FornecedorResponse, FornecedorUpdate

router = APIRouter()

CARGOS = ["Master", "Compras"]


@router.get("", response_model=list[FornecedorResponse])
async def listar_fornecedores(
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    result = await db.execute(select(Fornecedor))
    return result.scalars().all()


@router.post("", response_model=FornecedorResponse)
async def criar_fornecedor(
    body: FornecedorCreate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    f = Fornecedor(**body.model_dump())
    db.add(f)
    await db.commit()
    await db.refresh(f)
    return f


@router.put("/{fornecedor_id}", response_model=FornecedorResponse)
async def atualizar_fornecedor(
    fornecedor_id: int,
    body: FornecedorUpdate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    f = await db.get(Fornecedor, fornecedor_id)
    if not f:
        raise HTTPException(404, "Fornecedor nao encontrado")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(f, k, v)
    await db.commit()
    await db.refresh(f)
    return f


@router.delete("/{fornecedor_id}")
async def remover_fornecedor(
    fornecedor_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    f = await db.get(Fornecedor, fornecedor_id)
    if not f:
        raise HTTPException(404, "Fornecedor nao encontrado")
    await db.delete(f)
    await db.commit()
    return {"ok": True}
