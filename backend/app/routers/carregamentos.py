from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_cargo
from app.models.carregamento import Carregamento
from app.models.obra import Obra
from app.schemas.carregamento import CarregamentoCreate, CarregamentoResponse
from app.services.carregamento import calcular_paineis_disponiveis

router = APIRouter()

CARGOS = ["Master", "Mestre", "Encarregado"]


def _calcular_sequencia(paineis: list) -> list:
    return list(range(len(paineis) - 1, -1, -1))


@router.get("/", response_model=list[CarregamentoResponse])
async def listar_carregamentos(
    obra_id: int | None = None,
    status: str | None = None,
    status_autorizacao: str | None = None,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    q = select(Carregamento)
    if obra_id:
        q = q.where(Carregamento.obra_id == obra_id)
    if status:
        q = q.where(Carregamento.status == status)
    if status_autorizacao:
        q = q.where(Carregamento.status_autorizacao == status_autorizacao)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/fabrica", response_model=list[CarregamentoResponse])
async def carregamentos_fabrica(
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    result = await db.execute(
        select(Carregamento).where(
            Carregamento.status_autorizacao == "Autorizado",
            Carregamento.status != "Carregado",
        )
    )
    return result.scalars().all()


@router.get("/disponiveis")
async def paineis_disponiveis(
    obra_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    return await calcular_paineis_disponiveis(db, obra_id)


@router.get("/{carregamento_id}", response_model=CarregamentoResponse)
async def buscar_carregamento(
    carregamento_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    c = await db.get(Carregamento, carregamento_id)
    if not c:
        raise HTTPException(404, "Carregamento nao encontrado")
    return c


@router.post("/", response_model=CarregamentoResponse)
async def criar_carregamento(
    body: CarregamentoCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_cargo(CARGOS)),
):
    obra = await db.get(Obra, body.obra_id)
    if not obra:
        raise HTTPException(404, "Obra nao encontrada")

    sequencia = _calcular_sequencia(body.paineis)
    c = Carregamento(
        obra_id=body.obra_id,
        obra_nome=obra.nome,
        veiculo=body.veiculo,
        paineis=body.paineis,
        sequencia_montagem=sequencia,
        status_autorizacao="Aguardando",
        status="Pendente",
        solicitante=current_user.login,
        data_solicitacao=date.today().isoformat(),
    )
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return c


@router.post("/{carregamento_id}/executar", response_model=CarregamentoResponse)
async def executar_carregamento(
    carregamento_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_cargo(CARGOS)),
):
    c = await db.get(Carregamento, carregamento_id)
    if not c:
        raise HTTPException(404, "Carregamento nao encontrado")
    if c.status_autorizacao != "Autorizado":
        raise HTTPException(400, "Carregamento nao esta autorizado")

    c.status = "Carregado"
    c.executado_por = current_user.login
    c.data_execucao = date.today().isoformat()

    await db.commit()
    await db.refresh(c)
    return c
