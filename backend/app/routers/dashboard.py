from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_cargo
from app.models.carregamento import Carregamento
from app.models.obra import Obra
from app.models.solicitacao import Solicitacao

router = APIRouter()


@router.get("/")
async def dashboard(
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(["Master", "Mestre"])),
):
    total_obras = (await db.execute(select(func.count()).select_from(Obra))).scalar()
    total_solicitacoes = (await db.execute(select(func.count()).select_from(Solicitacao))).scalar()

    from datetime import date
    hoje = date.today().isoformat()

    result_sol = await db.execute(select(Solicitacao).where(Solicitacao.status_autorizacao == "Autorizado"))
    solicitacoes = result_sol.scalars().all()
    producao_hoje = sum(
        sum(h.get("qtd", 0) for h in (s.historico_painel or []) if h.get("data") == hoje)
        + sum(h.get("qtd", 0) for h in (s.historico_pilar or []) if h.get("data") == hoje)
        + sum(h.get("qtd", 0) for h in (s.historico_sapata or []) if h.get("data") == hoje)
        for s in solicitacoes
    )

    pendencias_fab = (await db.execute(
        select(func.count()).select_from(Solicitacao).where(Solicitacao.status_autorizacao == "Aguardando")
    )).scalar()
    pendencias_log = (await db.execute(
        select(func.count()).select_from(Carregamento).where(Carregamento.status_autorizacao == "Aguardando")
    )).scalar()

    obras_ativas_result = await db.execute(
        select(Obra).limit(5)
    )
    obras_ativas = obras_ativas_result.scalars().all()

    return {
        "totalObras": total_obras,
        "totalSolicitacoes": total_solicitacoes,
        "producaoHoje": producao_hoje,
        "pendenciasAutorizacao": (pendencias_fab or 0) + (pendencias_log or 0),
        "obrasMaisAtivas": [{"id": o.id, "nome": o.nome, "cliente": o.cliente} for o in obras_ativas],
    }
