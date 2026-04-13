from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.carregamento import Carregamento
from app.models.solicitacao import Solicitacao


async def calcular_paineis_disponiveis(db: AsyncSession, obra_id: int) -> list[dict]:
    result = await db.execute(
        select(Solicitacao).where(
            Solicitacao.obra_id == obra_id,
            Solicitacao.status_autorizacao == "Autorizado",
        )
    )
    solicitacoes = result.scalars().all()

    result = await db.execute(
        select(Carregamento).where(
            Carregamento.obra_id == obra_id,
            Carregamento.status_autorizacao != "Negado",
        )
    )
    carregamentos = result.scalars().all()

    reservados_por_solicitacao: dict[int, int] = {}
    for c in carregamentos:
        for p in (c.paineis or []):
            sid = p.get("solicitacaoId", 0)
            reservados_por_solicitacao[sid] = reservados_por_solicitacao.get(sid, 0) + 1

    paineis_disponiveis = []
    for s in solicitacoes:
        reservado = reservados_por_solicitacao.get(s.id, 0)
        disponivel = max(s.fabricado_painel - reservado, 0)
        if disponivel > 0:
            paineis_disponiveis.append({
                "solicitacaoId": s.id,
                "obraNome": s.obra_nome,
                "tipo": s.tipo_painel,
                "comp": float(s.painel_comp),
                "alt": float(s.painel_alt),
                "disponivel": disponivel,
                "fabricado": s.fabricado_painel,
                "reservado": reservado,
            })

    return paineis_disponiveis
