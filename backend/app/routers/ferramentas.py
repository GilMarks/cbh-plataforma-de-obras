from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_cargo
from app.models.ferramenta import Ferramenta
from app.schemas.ferramenta import EmprestarRequest, FerramentaCreate, FerramentaResponse, FerramentaUpdate

router = APIRouter()

CARGOS = ["Master", "Compras"]


@router.get("/", response_model=list[FerramentaResponse])
async def listar_ferramentas(
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    result = await db.execute(select(Ferramenta))
    return result.scalars().all()


@router.post("/", response_model=FerramentaResponse)
async def criar_ferramenta(
    body: FerramentaCreate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    f = Ferramenta(**body.model_dump())
    db.add(f)
    await db.commit()
    await db.refresh(f)
    return f


@router.put("/{ferramenta_id}", response_model=FerramentaResponse)
async def atualizar_ferramenta(
    ferramenta_id: int,
    body: FerramentaUpdate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    f = await db.get(Ferramenta, ferramenta_id)
    if not f:
        raise HTTPException(404, "Ferramenta nao encontrada")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(f, k, v)
    await db.commit()
    await db.refresh(f)
    return f


@router.delete("/{ferramenta_id}")
async def remover_ferramenta(
    ferramenta_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    f = await db.get(Ferramenta, ferramenta_id)
    if not f:
        raise HTTPException(404, "Ferramenta nao encontrada")
    await db.delete(f)
    await db.commit()
    return {"ok": True}


@router.post("/{ferramenta_id}/emprestar", response_model=FerramentaResponse)
async def emprestar(
    ferramenta_id: int,
    body: EmprestarRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    f = await db.get(Ferramenta, ferramenta_id)
    if not f:
        raise HTTPException(404, "Ferramenta nao encontrada")
    if f.status == "Emprestada":
        raise HTTPException(400, "Ferramenta ja esta emprestada")

    f.status = "Emprestada"
    f.responsavel_atual = body.responsavel
    f.data_emprestimo = date.today().isoformat()
    f.data_devolvida = ""

    await db.commit()
    await db.refresh(f)
    return f


@router.post("/{ferramenta_id}/devolver", response_model=FerramentaResponse)
async def devolver(
    ferramenta_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    f = await db.get(Ferramenta, ferramenta_id)
    if not f:
        raise HTTPException(404, "Ferramenta nao encontrada")
    if f.status != "Emprestada":
        raise HTTPException(400, "Ferramenta nao esta emprestada")

    historico = list(f.historico_uso or [])
    historico.append({
        "responsavel": f.responsavel_atual,
        "dataRetirada": f.data_emprestimo,
        "dataDevolucao": date.today().isoformat(),
    })
    f.historico_uso = historico
    f.data_devolvida = date.today().isoformat()
    f.responsavel_atual = ""
    f.status = "Disponivel"

    await db.commit()
    await db.refresh(f)
    return f
