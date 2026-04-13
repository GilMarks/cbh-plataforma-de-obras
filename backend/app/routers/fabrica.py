from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, require_cargo
from app.models.solicitacao import Solicitacao
from app.schemas.solicitacao import LancarProducaoRequest, SolicitacaoResponse
from app.services import fabrica as fabrica_service

router = APIRouter()

CARGOS_PRODUCAO = ["Master", "Mestre", "Encarregado", "Meio-profissional", "Ferreiro", "Betoneiro", "Servente"]
CARGOS_GESTAO = ["Master", "Mestre", "Encarregado"]


@router.get("/producao", response_model=list[SolicitacaoResponse])
async def listar_producao(
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS_PRODUCAO)),
):
    result = await db.execute(
        select(Solicitacao).where(Solicitacao.status_autorizacao == "Autorizado")
    )
    return result.scalars().all()


@router.post("/producao/{solicitacao_id}/lancar", response_model=SolicitacaoResponse)
async def lancar_producao(
    solicitacao_id: int,
    body: LancarProducaoRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_cargo(CARGOS_PRODUCAO)),
):
    return await fabrica_service.lancar_producao(db, solicitacao_id, body.tipo, body.quantidade, current_user.login)


@router.get("/historico")
async def historico_producao(
    tipo: str | None = None,
    data_inicio: str | None = None,
    data_fim: str | None = None,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS_GESTAO)),
):
    result = await db.execute(
        select(Solicitacao).where(Solicitacao.status_autorizacao == "Autorizado")
    )
    solicitacoes = result.scalars().all()

    entries = []
    for s in solicitacoes:
        if not tipo or tipo == "painel":
            for h in (s.historico_painel or []):
                entry = {"solicitacaoId": s.id, "obraNome": s.obra_nome, "tipo": "painel", **h}
                if data_inicio and h.get("data", "") < data_inicio:
                    continue
                if data_fim and h.get("data", "") > data_fim:
                    continue
                entries.append(entry)
        if not tipo or tipo == "pilar":
            for h in (s.historico_pilar or []):
                entry = {"solicitacaoId": s.id, "obraNome": s.obra_nome, "tipo": "pilar", **h}
                if data_inicio and h.get("data", "") < data_inicio:
                    continue
                if data_fim and h.get("data", "") > data_fim:
                    continue
                entries.append(entry)
        if not tipo or tipo == "sapata":
            for h in (s.historico_sapata or []):
                entry = {"solicitacaoId": s.id, "obraNome": s.obra_nome, "tipo": "sapata", **h}
                if data_inicio and h.get("data", "") < data_inicio:
                    continue
                if data_fim and h.get("data", "") > data_fim:
                    continue
                entries.append(entry)

    return entries


@router.get("/estoque")
async def estoque_pecas(
    obra_id: int | None = None,
    tipo: str | None = None,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo([*CARGOS_GESTAO, "Compras"])),
):
    q = select(Solicitacao).where(Solicitacao.status_autorizacao == "Autorizado")
    if obra_id:
        q = q.where(Solicitacao.obra_id == obra_id)
    result = await db.execute(q)
    solicitacoes = result.scalars().all()

    estoque = []
    for s in solicitacoes:
        if not tipo or tipo == "painel":
            estoque.append({
                "solicitacaoId": s.id, "obraNome": s.obra_nome,
                "tipo": "painel", "fabricado": s.fabricado_painel, "saldo": s.saldo_painel,
            })
        if not tipo or tipo == "pilar":
            estoque.append({
                "solicitacaoId": s.id, "obraNome": s.obra_nome,
                "tipo": "pilar", "fabricado": s.fabricado_pilar, "saldo": s.saldo_pilar,
            })
        if not tipo or tipo == "sapata":
            estoque.append({
                "solicitacaoId": s.id, "obraNome": s.obra_nome,
                "tipo": "sapata", "fabricado": s.fabricado_sapata, "saldo": s.saldo_sapata,
            })

    return estoque
