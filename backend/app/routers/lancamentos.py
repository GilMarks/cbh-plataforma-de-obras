from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_cargo
from app.models.banco import Banco
from app.models.lancamento import LancamentoFinanceiro
from app.schemas.lancamento import LancamentoCreate, LancamentoResponse, PagarRequest

router = APIRouter()

CARGOS = ["Master", "Financeiro"]


@router.get("/dashboard")
async def dashboard_financeiro(
    periodo: str | None = None,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    result = await db.execute(select(LancamentoFinanceiro))
    lancamentos = result.scalars().all()

    total_receitas = sum(float(l.valor) for l in lancamentos if l.tipo == "Receita" and l.status == "Pago")
    total_despesas = sum(float(l.valor) for l in lancamentos if l.tipo == "Despesa" and l.status == "Pago")
    total_atrasado = sum(float(l.valor) for l in lancamentos if l.status == "Vencido")
    saldo = total_receitas - total_despesas

    proximas = sorted(
        [l for l in lancamentos if l.status == "Pendente" and l.vencimento],
        key=lambda x: x.vencimento,
    )[:5]

    ultimas = sorted(
        [l for l in lancamentos if l.status == "Pago"],
        key=lambda x: x.data_pagamento,
        reverse=True,
    )[:5]

    return {
        "totalReceitas": total_receitas,
        "totalDespesas": total_despesas,
        "saldo": saldo,
        "totalAtrasado": total_atrasado,
        "proximasContas": [{"id": l.id, "descricao": l.descricao, "valor": float(l.valor), "vencimento": l.vencimento} for l in proximas],
        "ultimasEntradas": [{"id": l.id, "descricao": l.descricao, "valor": float(l.valor), "dataPagamento": l.data_pagamento} for l in ultimas],
    }


@router.get("/", response_model=list[LancamentoResponse])
async def listar_lancamentos(
    tipo: str | None = None,
    status: str | None = None,
    centro: str | None = None,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    q = select(LancamentoFinanceiro)
    if tipo:
        q = q.where(LancamentoFinanceiro.tipo == tipo)
    if status:
        q = q.where(LancamentoFinanceiro.status == status)
    if centro:
        q = q.where(LancamentoFinanceiro.centro == centro)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{lancamento_id}", response_model=LancamentoResponse)
async def buscar_lancamento(
    lancamento_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    l = await db.get(LancamentoFinanceiro, lancamento_id)
    if not l:
        raise HTTPException(404, "Lancamento nao encontrado")
    return l


@router.post("/", response_model=LancamentoResponse)
async def criar_lancamento(
    body: LancamentoCreate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    hoje = date.today().isoformat()
    l = LancamentoFinanceiro(
        **body.model_dump(),
        status="Pendente",
        data=hoje,
        emissao=hoje,
    )
    db.add(l)
    await db.commit()
    await db.refresh(l)
    return l


@router.post("/{lancamento_id}/pagar", response_model=LancamentoResponse)
async def pagar_lancamento(
    lancamento_id: int,
    body: PagarRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    l = await db.get(LancamentoFinanceiro, lancamento_id)
    if not l:
        raise HTTPException(404, "Lancamento nao encontrado")
    if l.status == "Pago":
        raise HTTPException(400, "Lancamento ja foi pago")

    banco = await db.get(Banco, body.banco_id)
    if not banco:
        raise HTTPException(404, "Banco nao encontrado")

    l.status = "Pago"
    l.data_pagamento = body.data_pagamento or date.today().isoformat()
    l.valor_pago = body.valor_pago if body.valor_pago is not None else float(l.valor)
    l.conta_origem = banco.nome

    await db.commit()
    await db.refresh(l)
    return l
