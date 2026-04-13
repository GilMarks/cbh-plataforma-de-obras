from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.config import Config
from app.models.processo import Processo
from app.models.solicitacao_compra import SolicitacaoCompra


async def gerar_numero_processo(db: AsyncSession) -> str:
    result = await db.execute(select(Config).where(Config.chave == "numeroProcesso"))
    config = result.scalar_one_or_none()

    if config:
        proximo = int(config.valor) + 1
        config.valor = str(proximo)
    else:
        proximo = 1
        db.add(Config(chave="numeroProcesso", valor="1"))

    await db.flush()
    return f"CP-{proximo:05d}"


async def enviar_para_autorizacao(
    db: AsyncSession,
    solicitacao_compra_id: int,
    user,
) -> tuple[SolicitacaoCompra, Processo]:
    sc = await db.get(SolicitacaoCompra, solicitacao_compra_id)
    if not sc or sc.status_fluxo != "EM_ORCAMENTO":
        raise HTTPException(400, "Solicitacao nao esta em orcamento")

    if not sc.fornecedor:
        raise HTTPException(400, "Fornecedor obrigatorio antes de enviar para autorizacao")

    hoje = date.today().isoformat()
    numero = await gerar_numero_processo(db)

    sc.status_fluxo = "AGUARDANDO_AUTORIZACAO"

    processo = Processo(
        numero=numero,
        obra=sc.obra_nome,
        item=sc.item,
        qtd=float(sc.quantidade),
        valor=float(sc.valor),
        forma_pagamento=sc.pagamento,
        status="AGUARDANDO_AUTORIZACAO",
        solicitacao_compra_id=sc.id,
        timeline=[{
            "data": hoje,
            "status": "AGUARDANDO_AUTORIZACAO",
            "responsavel": user.login,
        }],
    )
    db.add(processo)

    await db.commit()
    await db.refresh(sc)
    await db.refresh(processo)
    return sc, processo
