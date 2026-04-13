from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_cargo
from app.models.obra import Obra
from app.models.solicitacao_compra import SolicitacaoCompra
from app.schemas.solicitacao_compra import (
    CotacaoUpdate,
    SolicitacaoCompraCreate,
    SolicitacaoCompraResponse,
)
from app.services.compras import enviar_para_autorizacao

router = APIRouter()

CARGOS = ["Master", "Mestre", "Encarregado", "Compras"]


@router.get("", response_model=list[SolicitacaoCompraResponse])
async def listar(
    obra_id: int | None = None,
    status_fluxo: str | None = None,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    q = select(SolicitacaoCompra)
    if obra_id:
        q = q.where(SolicitacaoCompra.obra_id == obra_id)
    if status_fluxo:
        q = q.where(SolicitacaoCompra.status_fluxo == status_fluxo)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{sc_id}", response_model=SolicitacaoCompraResponse)
async def buscar(
    sc_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    sc = await db.get(SolicitacaoCompra, sc_id)
    if not sc:
        raise HTTPException(404, "Solicitacao nao encontrada")
    return sc


@router.post("", response_model=SolicitacaoCompraResponse)
async def criar(
    body: SolicitacaoCompraCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_cargo(CARGOS)),
):
    obra = await db.get(Obra, body.obra_id)
    if not obra:
        raise HTTPException(404, "Obra nao encontrada")

    sc = SolicitacaoCompra(
        **body.model_dump(),
        obra_nome=obra.nome,
        solicitante=current_user.login,
        data=date.today().isoformat(),
        status="SOLICITADO",
        status_fluxo="SOLICITADO",
    )
    db.add(sc)
    await db.commit()
    await db.refresh(sc)
    return sc


@router.put("/{sc_id}/cotacao", response_model=SolicitacaoCompraResponse)
async def salvar_cotacao(
    sc_id: int,
    body: CotacaoUpdate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(["Master", "Compras"])),
):
    sc = await db.get(SolicitacaoCompra, sc_id)
    if not sc:
        raise HTTPException(404, "Solicitacao nao encontrada")

    sc.fornecedor = body.fornecedor
    if body.valor is not None:
        sc.valor = body.valor
    if body.pagamento is not None:
        sc.pagamento = body.pagamento
    if body.imagem_orcamento is not None:
        sc.imagem_orcamento = body.imagem_orcamento
    sc.status_fluxo = "EM_ORCAMENTO"

    await db.commit()
    await db.refresh(sc)
    return sc


@router.post("/{sc_id}/enviar-autorizacao")
async def enviar_autorizacao(
    sc_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_cargo(["Master", "Compras"])),
):
    sc, processo = await enviar_para_autorizacao(db, sc_id, current_user)
    return {"solicitacao": sc, "processo": processo}


@router.delete("/{sc_id}")
async def remover(
    sc_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(["Master"])),
):
    sc = await db.get(SolicitacaoCompra, sc_id)
    if not sc:
        raise HTTPException(404, "Solicitacao nao encontrada")
    await db.delete(sc)
    await db.commit()
    return {"ok": True}
