from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, require_cargo
from app.models.obra import Obra
from app.models.solicitacao import Solicitacao
from app.schemas.solicitacao import SolicitacaoCreate, SolicitacaoResponse

router = APIRouter()

CARGOS = ["Master", "Mestre", "Encarregado"]


@router.get("/", response_model=list[SolicitacaoResponse])
async def listar_solicitacoes(
    obra_id: int | None = None,
    status_autorizacao: str | None = None,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    q = select(Solicitacao)
    if obra_id:
        q = q.where(Solicitacao.obra_id == obra_id)
    if status_autorizacao:
        q = q.where(Solicitacao.status_autorizacao == status_autorizacao)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{solicitacao_id}", response_model=SolicitacaoResponse)
async def buscar_solicitacao(
    solicitacao_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    s = await db.get(Solicitacao, solicitacao_id)
    if not s:
        raise HTTPException(404, "Solicitacao nao encontrada")
    return s


@router.post("/", response_model=SolicitacaoResponse)
async def criar_solicitacao(
    body: SolicitacaoCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_cargo(CARGOS)),
):
    obra = await db.get(Obra, body.obra_id)
    if not obra:
        raise HTTPException(404, "Obra nao encontrada")

    s = Solicitacao(
        **body.model_dump(),
        obra_nome=obra.nome,
        cliente_nome=obra.cliente,
        solicitante=current_user.login,
        cargo_solicitante=current_user.cargo,
        data_solicitacao_registro=date.today().isoformat(),
        status_autorizacao="Aguardando",
    )
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return s


@router.delete("/{solicitacao_id}")
async def remover_solicitacao(
    solicitacao_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(["Master"])),
):
    s = await db.get(Solicitacao, solicitacao_id)
    if not s:
        raise HTTPException(404, "Solicitacao nao encontrada")
    await db.delete(s)
    await db.commit()
    return {"ok": True}
