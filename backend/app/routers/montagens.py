from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_cargo
from app.models.carregamento import Carregamento
from app.models.montagem import Montagem
from app.schemas.montagem import MontagemCreate, MontagemResponse

router = APIRouter()

CARGOS = ["Master", "Mestre", "Encarregado"]


@router.get("/", response_model=list[MontagemResponse])
async def listar_montagens(
    obra_id: int | None = None,
    carregamento_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    q = select(Montagem)
    if obra_id:
        q = q.where(Montagem.obra_id == obra_id)
    if carregamento_id:
        q = q.where(Montagem.carregamento_id == carregamento_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/carregamentos-disponiveis", response_model=list)
async def carregamentos_disponiveis(
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS)),
):
    result = await db.execute(
        select(Carregamento).where(
            Carregamento.status.in_(["Carregado", "Entregue"])
        )
    )
    carregamentos = result.scalars().all()
    return [
        {
            "id": c.id, "obraNome": c.obra_nome, "veiculo": c.veiculo,
            "status": c.status, "paineis": c.paineis,
        }
        for c in carregamentos
    ]


@router.post("/", response_model=list[MontagemResponse])
async def registrar_montagem(
    body: MontagemCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_cargo(CARGOS)),
):
    c = await db.get(Carregamento, body.carregamento_id)
    if not c:
        raise HTTPException(404, "Carregamento nao encontrado")
    if c.status not in ("Carregado", "Entregue"):
        raise HTTPException(400, "Carregamento nao esta pronto para montagem")

    hoje = date.today().isoformat()
    montagens = []
    for p in (c.paineis or []):
        m = Montagem(
            obra_id=c.obra_id,
            obra_nome=c.obra_nome,
            carregamento_id=c.id,
            painel_id=str(p.get("id", "")),
            tipo=p.get("tipo", ""),
            dimensao=f"{p.get('comp', '')}x{p.get('alt', '')}",
            equipe_responsavel=body.equipe_responsavel,
            data_montagem=hoje,
            observacoes=body.observacoes,
        )
        db.add(m)
        montagens.append(m)

    c.status = "Entregue"
    await db.commit()
    for m in montagens:
        await db.refresh(m)
    return montagens
