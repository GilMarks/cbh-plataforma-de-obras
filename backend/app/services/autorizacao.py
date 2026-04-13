from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.carregamento import Carregamento
from app.models.lancamento import LancamentoFinanceiro
from app.models.processo import Processo
from app.models.solicitacao import Solicitacao
from app.models.solicitacao_compra import SolicitacaoCompra


async def aprovar_compra(
    db: AsyncSession,
    solicitacao_compra_id: int,
    user,
) -> SolicitacaoCompra:
    hoje = date.today().isoformat()

    sc = await db.get(SolicitacaoCompra, solicitacao_compra_id)
    if not sc or sc.status_fluxo != "AGUARDANDO_AUTORIZACAO":
        raise HTTPException(400, "Solicitacao nao esta aguardando autorizacao")

    sc.status_fluxo = "AUTORIZADO"
    sc.status = "AUTORIZADO"

    result = await db.execute(
        select(Processo).where(
            Processo.item == sc.item,
            Processo.obra == sc.obra_nome,
            Processo.status == "AGUARDANDO_AUTORIZACAO",
        )
    )
    processo = result.scalar_one_or_none()

    if processo:
        processo.status = "NO_FINANCEIRO"
        timeline = list(processo.timeline or [])
        timeline.append({"data": hoje, "status": "AUTORIZADO", "responsavel": user.login})
        timeline.append({"data": hoje, "status": "NO_FINANCEIRO", "responsavel": "Sistema"})
        processo.timeline = timeline

    lancamento = LancamentoFinanceiro(
        tipo="Despesa",
        centro=sc.obra_nome,
        descricao=sc.item,
        fornecedor=sc.fornecedor,
        valor=float(sc.valor),
        forma_pagamento=sc.pagamento,
        status="Pendente",
        proc_id=processo.id if processo else 0,
        data=hoje,
        emissao=hoje,
        vencimento="",
    )
    db.add(lancamento)

    await db.commit()
    await db.refresh(sc)
    return sc


async def negar_compra(
    db: AsyncSession,
    solicitacao_compra_id: int,
    user,
) -> SolicitacaoCompra:
    sc = await db.get(SolicitacaoCompra, solicitacao_compra_id)
    if not sc or sc.status_fluxo != "AGUARDANDO_AUTORIZACAO":
        raise HTTPException(400, "Solicitacao nao esta aguardando autorizacao")

    sc.status_fluxo = "NEGADO"
    sc.status = "NEGADO"

    result = await db.execute(
        select(Processo).where(
            Processo.item == sc.item,
            Processo.obra == sc.obra_nome,
            Processo.status == "AGUARDANDO_AUTORIZACAO",
        )
    )
    processo = result.scalar_one_or_none()
    if processo:
        hoje = date.today().isoformat()
        processo.status = "NEGADO"
        timeline = list(processo.timeline or [])
        timeline.append({"data": hoje, "status": "NEGADO", "responsavel": user.login})
        processo.timeline = timeline

    await db.commit()
    await db.refresh(sc)
    return sc


async def aprovar_fabricacao(
    db: AsyncSession,
    solicitacao_id: int,
    user,
) -> Solicitacao:
    hoje = date.today().isoformat()
    s = await db.get(Solicitacao, solicitacao_id)
    if not s or s.status_autorizacao != "Aguardando":
        raise HTTPException(400, "Solicitacao nao esta aguardando autorizacao")

    s.status_autorizacao = "Autorizado"
    s.autorizado_por = user.login
    s.data_autorizacao = hoje

    await db.commit()
    await db.refresh(s)
    return s


async def negar_fabricacao(
    db: AsyncSession,
    solicitacao_id: int,
    user,
) -> Solicitacao:
    hoje = date.today().isoformat()
    s = await db.get(Solicitacao, solicitacao_id)
    if not s or s.status_autorizacao != "Aguardando":
        raise HTTPException(400, "Solicitacao nao esta aguardando autorizacao")

    s.status_autorizacao = "Negado"
    s.autorizado_por = user.login
    s.data_autorizacao = hoje

    await db.commit()
    await db.refresh(s)
    return s


async def aprovar_carregamento(
    db: AsyncSession,
    carregamento_id: int,
    user,
) -> Carregamento:
    hoje = date.today().isoformat()
    c = await db.get(Carregamento, carregamento_id)
    if not c or c.status_autorizacao != "Aguardando":
        raise HTTPException(400, "Carregamento nao esta aguardando autorizacao")

    c.status_autorizacao = "Autorizado"
    c.autorizado_por = user.login
    c.data_autorizacao = hoje

    await db.commit()
    await db.refresh(c)
    return c


async def negar_carregamento(
    db: AsyncSession,
    carregamento_id: int,
    user,
) -> Carregamento:
    hoje = date.today().isoformat()
    c = await db.get(Carregamento, carregamento_id)
    if not c or c.status_autorizacao != "Aguardando":
        raise HTTPException(400, "Carregamento nao esta aguardando autorizacao")

    c.status_autorizacao = "Negado"
    c.autorizado_por = user.login
    c.data_autorizacao = hoje

    await db.commit()
    await db.refresh(c)
    return c
