from datetime import date

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.solicitacao import Solicitacao


async def lancar_producao(
    db: AsyncSession,
    solicitacao_id: int,
    tipo: str,
    quantidade: int,
    responsavel: str,
) -> Solicitacao:
    s = await db.get(Solicitacao, solicitacao_id)
    if not s or s.status_autorizacao != "Autorizado":
        raise HTTPException(400, "Solicitacao nao autorizada")

    hoje = date.today().isoformat()

    if tipo == "painel":
        meta = s.paineis
        fabricado_atual = s.fabricado_painel
        qtd_efetiva = min(quantidade, meta - fabricado_atual)
        if qtd_efetiva <= 0:
            raise HTTPException(400, "Meta ja atingida para paineis")
        new_fab = fabricado_atual + qtd_efetiva
        s.fabricado_painel = new_fab
        s.saldo_painel = meta - new_fab
        s.status_painel = "Fabricado" if new_fab >= meta else "Parcial"
        historico = list(s.historico_painel or [])
        historico.append({"data": hoje, "qtd": qtd_efetiva, "responsavel": responsavel})
        s.historico_painel = historico

    elif tipo == "pilar":
        meta = s.pilares
        fabricado_atual = s.fabricado_pilar
        qtd_efetiva = min(quantidade, meta - fabricado_atual)
        if qtd_efetiva <= 0:
            raise HTTPException(400, "Meta ja atingida para pilares")
        new_fab = fabricado_atual + qtd_efetiva
        s.fabricado_pilar = new_fab
        s.saldo_pilar = meta - new_fab
        s.status_pilar = "Fabricado" if new_fab >= meta else "Parcial"
        historico = list(s.historico_pilar or [])
        historico.append({"data": hoje, "qtd": qtd_efetiva, "responsavel": responsavel})
        s.historico_pilar = historico

    elif tipo == "sapata":
        meta = s.sapatas
        fabricado_atual = s.fabricado_sapata
        qtd_efetiva = min(quantidade, meta - fabricado_atual)
        if qtd_efetiva <= 0:
            raise HTTPException(400, "Meta ja atingida para sapatas")
        new_fab = fabricado_atual + qtd_efetiva
        s.fabricado_sapata = new_fab
        s.saldo_sapata = meta - new_fab
        s.status_sapata = "Fabricado" if new_fab >= meta else "Parcial"
        historico = list(s.historico_sapata or [])
        historico.append({"data": hoje, "qtd": qtd_efetiva, "responsavel": responsavel})
        s.historico_sapata = historico

    else:
        raise HTTPException(400, f"Tipo invalido: {tipo}")

    await db.commit()
    await db.refresh(s)
    return s
