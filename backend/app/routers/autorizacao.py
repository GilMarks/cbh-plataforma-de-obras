from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_cargo
from app.models.carregamento import Carregamento
from app.models.solicitacao import Solicitacao
from app.models.solicitacao_compra import SolicitacaoCompra
from app.schemas.carregamento import CarregamentoResponse
from app.schemas.solicitacao import SolicitacaoResponse
from app.schemas.solicitacao_compra import SolicitacaoCompraResponse
from app.services import autorizacao as autorizacao_service

router = APIRouter()


@router.get("/pendencias")
async def pendencias(
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(["Master"])),
):
    compras = await db.execute(
        select(SolicitacaoCompra).where(SolicitacaoCompra.status_fluxo == "AGUARDANDO_AUTORIZACAO")
    )
    fabricacao = await db.execute(
        select(Solicitacao).where(Solicitacao.status_autorizacao == "Aguardando")
    )
    logistica = await db.execute(
        select(Carregamento).where(Carregamento.status_autorizacao == "Aguardando")
    )
    n_compras = len(compras.scalars().all())
    n_fabricacao = len(fabricacao.scalars().all())
    n_logistica = len(logistica.scalars().all())
    return {
        "compras": n_compras,
        "fabricacao": n_fabricacao,
        "logistica": n_logistica,
        "total": n_compras + n_fabricacao + n_logistica,
    }


@router.get("/compras", response_model=list[SolicitacaoCompraResponse])
async def compras_pendentes(
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(["Master"])),
):
    result = await db.execute(
        select(SolicitacaoCompra).where(SolicitacaoCompra.status_fluxo == "AGUARDANDO_AUTORIZACAO")
    )
    return result.scalars().all()


@router.post("/compras/{solicitacao_compra_id}/aprovar", response_model=SolicitacaoCompraResponse)
async def aprovar_compra(
    solicitacao_compra_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_cargo(["Master"])),
):
    return await autorizacao_service.aprovar_compra(db, solicitacao_compra_id, current_user)


@router.post("/compras/{solicitacao_compra_id}/negar", response_model=SolicitacaoCompraResponse)
async def negar_compra(
    solicitacao_compra_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_cargo(["Master"])),
):
    return await autorizacao_service.negar_compra(db, solicitacao_compra_id, current_user)


@router.get("/fabricacao", response_model=list[SolicitacaoResponse])
async def fabricacao_pendente(
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(["Master"])),
):
    result = await db.execute(
        select(Solicitacao).where(Solicitacao.status_autorizacao == "Aguardando")
    )
    return result.scalars().all()


@router.post("/fabricacao/{solicitacao_id}/aprovar", response_model=SolicitacaoResponse)
async def aprovar_fabricacao(
    solicitacao_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_cargo(["Master"])),
):
    return await autorizacao_service.aprovar_fabricacao(db, solicitacao_id, current_user)


@router.post("/fabricacao/{solicitacao_id}/negar", response_model=SolicitacaoResponse)
async def negar_fabricacao(
    solicitacao_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_cargo(["Master"])),
):
    return await autorizacao_service.negar_fabricacao(db, solicitacao_id, current_user)


@router.get("/logistica", response_model=list[CarregamentoResponse])
async def logistica_pendente(
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(["Master"])),
):
    result = await db.execute(
        select(Carregamento).where(Carregamento.status_autorizacao == "Aguardando")
    )
    return result.scalars().all()


@router.post("/logistica/{carregamento_id}/aprovar", response_model=CarregamentoResponse)
async def aprovar_carregamento(
    carregamento_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_cargo(["Master"])),
):
    return await autorizacao_service.aprovar_carregamento(db, carregamento_id, current_user)


@router.post("/logistica/{carregamento_id}/negar", response_model=CarregamentoResponse)
async def negar_carregamento(
    carregamento_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_cargo(["Master"])),
):
    return await autorizacao_service.negar_carregamento(db, carregamento_id, current_user)
