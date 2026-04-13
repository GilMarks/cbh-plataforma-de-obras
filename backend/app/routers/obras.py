from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_cargo
from app.models.obra import Obra
from app.models.solicitacao import Solicitacao
from app.schemas.obra import ObraCreate, ObraProgresso, ObraResponse, ObraUpdate

router = APIRouter()

CARGOS = ["Master", "Mestre", "Encarregado"]


@router.get("/", response_model=list[ObraResponse])
async def listar_obras(
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    result = await db.execute(select(Obra))
    return result.scalars().all()


@router.get("/{obra_id}", response_model=ObraResponse)
async def buscar_obra(
    obra_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    obra = await db.get(Obra, obra_id)
    if not obra:
        raise HTTPException(404, "Obra nao encontrada")
    return obra


@router.post("/", response_model=ObraResponse)
async def criar_obra(
    body: ObraCreate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    obra = Obra(**body.model_dump())
    db.add(obra)
    await db.commit()
    await db.refresh(obra)
    return obra


@router.put("/{obra_id}", response_model=ObraResponse)
async def atualizar_obra(
    obra_id: int,
    body: ObraUpdate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    obra = await db.get(Obra, obra_id)
    if not obra:
        raise HTTPException(404, "Obra nao encontrada")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(obra, k, v)
    await db.commit()
    await db.refresh(obra)
    return obra


@router.delete("/{obra_id}")
async def remover_obra(
    obra_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(["Master"])),
):
    obra = await db.get(Obra, obra_id)
    if not obra:
        raise HTTPException(404, "Obra nao encontrada")
    await db.delete(obra)
    await db.commit()
    return {"ok": True}


@router.get("/{obra_id}/progresso", response_model=ObraProgresso)
async def progresso_obra(
    obra_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    obra = await db.get(Obra, obra_id)
    if not obra:
        raise HTTPException(404, "Obra nao encontrada")

    result = await db.execute(
        select(Solicitacao).where(
            Solicitacao.obra_id == obra_id,
            Solicitacao.status_autorizacao == "Autorizado",
        )
    )
    solicitacoes = result.scalars().all()

    fabricado_paineis = sum(s.fabricado_painel for s in solicitacoes)
    fabricado_pilares = sum(s.fabricado_pilar for s in solicitacoes)
    fabricado_sapatas = sum(s.fabricado_sapata for s in solicitacoes)

    def pct(fab, total):
        return round(fab / total * 100, 1) if total > 0 else 0

    return ObraProgresso(
        paineis={"total": obra.paineis_min, "fabricado": fabricado_paineis, "pct": pct(fabricado_paineis, obra.paineis_min)},
        pilares={"total": obra.pilares_min, "fabricado": fabricado_pilares, "pct": pct(fabricado_pilares, obra.pilares_min)},
        sapatas={"total": obra.sapatas_min, "fabricado": fabricado_sapatas, "pct": pct(fabricado_sapatas, obra.sapatas_min)},
    )
