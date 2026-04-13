from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_cargo
from app.models.movimentacao_estoque import MovimentacaoEstoque
from app.schemas.movimentacao_estoque import MovimentacaoResponse

router = APIRouter()

CARGOS = ["Master", "Compras", "Mestre"]


@router.get("/kpis")
async def kpis(
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    result = await db.execute(select(MovimentacaoEstoque))
    movs = result.scalars().all()
    entradas = sum(float(m.quantidade) for m in movs if m.tipo == "Entrada")
    saidas = sum(float(m.quantidade) for m in movs if m.tipo == "Saida")
    return {"totalEntradas": entradas, "totalSaidas": saidas, "totalMovimentacoes": len(movs)}


@router.get("/", response_model=list[MovimentacaoResponse])
async def historico(
    insumo_id: int | None = None,
    tipo: str | None = None,
    data_inicio: str | None = None,
    data_fim: str | None = None,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    q = select(MovimentacaoEstoque)
    if insumo_id:
        q = q.where(MovimentacaoEstoque.insumo_id == insumo_id)
    if tipo:
        q = q.where(MovimentacaoEstoque.tipo == tipo)
    if data_inicio:
        q = q.where(MovimentacaoEstoque.data >= data_inicio)
    if data_fim:
        q = q.where(MovimentacaoEstoque.data <= data_fim)
    result = await db.execute(q)
    return result.scalars().all()
