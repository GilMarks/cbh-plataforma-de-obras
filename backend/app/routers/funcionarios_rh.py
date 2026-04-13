import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_cargo
from app.models.funcionario_rh import FuncionarioRH
from app.schemas.funcionario_rh import FuncionarioCreate, FuncionarioResponse

router = APIRouter()

CARGOS = ["Master", "RH"]


@router.get("", response_model=list[FuncionarioResponse])
async def listar_funcionarios(
    busca: str | None = None,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    q = select(FuncionarioRH)
    if busca:
        pattern = f"%{busca}%"
        q = q.where(
            or_(
                FuncionarioRH.nome.ilike(pattern),
                FuncionarioRH.sobrenome.ilike(pattern),
                FuncionarioRH.ocupacao.ilike(pattern),
                FuncionarioRH.cpf.ilike(pattern),
            )
        )
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{funcionario_id}", response_model=FuncionarioResponse)
async def buscar_funcionario(
    funcionario_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    f = await db.get(FuncionarioRH, funcionario_id)
    if not f:
        raise HTTPException(404, "Funcionario nao encontrado")
    return f


@router.post("", response_model=FuncionarioResponse)
async def criar_funcionario(
    body: FuncionarioCreate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    codigo = f"FUN-{int(time.time() * 1000)}"
    f = FuncionarioRH(**body.model_dump(), codigo_interno=codigo)
    db.add(f)
    await db.commit()
    await db.refresh(f)
    return f


@router.put("/{funcionario_id}", response_model=FuncionarioResponse)
async def atualizar_funcionario(
    funcionario_id: int,
    body: FuncionarioCreate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    f = await db.get(FuncionarioRH, funcionario_id)
    if not f:
        raise HTTPException(404, "Funcionario nao encontrado")
    for k, v in body.model_dump().items():
        setattr(f, k, v)
    await db.commit()
    await db.refresh(f)
    return f


@router.delete("/{funcionario_id}")
async def remover_funcionario(
    funcionario_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    f = await db.get(FuncionarioRH, funcionario_id)
    if not f:
        raise HTTPException(404, "Funcionario nao encontrado")
    await db.delete(f)
    await db.commit()
    return {"ok": True}
