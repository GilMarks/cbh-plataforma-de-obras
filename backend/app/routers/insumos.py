from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_cargo
from app.models.insumo import Insumo
from app.models.movimentacao_estoque import MovimentacaoEstoque
from app.schemas.insumo import InsumoCreate, InsumoResponse, InsumoUpdate, MovimentarRequest
from app.schemas.movimentacao_estoque import MovimentacaoResponse

router = APIRouter()

CARGOS_LEITURA = ["Master", "Compras", "Mestre", "Encarregado"]
CARGOS_ESCRITA = ["Master", "Compras"]
CARGOS_MOV = ["Master", "Compras", "Mestre"]


@router.get("", response_model=list[InsumoResponse])
async def listar_insumos(
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS_LEITURA)),
):
    result = await db.execute(select(Insumo))
    return result.scalars().all()


@router.post("", response_model=InsumoResponse)
async def criar_insumo(
    body: InsumoCreate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS_ESCRITA)),
):
    insumo = Insumo(**body.model_dump())
    db.add(insumo)
    await db.commit()
    await db.refresh(insumo)
    return insumo


@router.put("/{insumo_id}", response_model=InsumoResponse)
async def atualizar_insumo(
    insumo_id: int,
    body: InsumoUpdate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(CARGOS_ESCRITA)),
):
    insumo = await db.get(Insumo, insumo_id)
    if not insumo:
        raise HTTPException(404, "Insumo nao encontrado")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(insumo, k, v)
    await db.commit()
    await db.refresh(insumo)
    return insumo


@router.delete("/{insumo_id}")
async def remover_insumo(
    insumo_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(["Master"])),
):
    insumo = await db.get(Insumo, insumo_id)
    if not insumo:
        raise HTTPException(404, "Insumo nao encontrado")
    await db.delete(insumo)
    await db.commit()
    return {"ok": True}


@router.post("/{insumo_id}/movimentar")
async def movimentar_insumo(
    insumo_id: int,
    body: MovimentarRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_cargo(CARGOS_MOV)),
):
    insumo = await db.get(Insumo, insumo_id)
    if not insumo:
        raise HTTPException(404, "Insumo nao encontrado")
    if body.quantidade <= 0:
        raise HTTPException(400, "Quantidade deve ser maior que zero")

    if body.tipo == "Entrada":
        insumo.estoque_atual = float(insumo.estoque_atual) + body.quantidade
    elif body.tipo == "Saida":
        insumo.estoque_atual = max(0, float(insumo.estoque_atual) - body.quantidade)
    else:
        raise HTTPException(400, "Tipo invalido: use Entrada ou Saida")

    mov = MovimentacaoEstoque(
        insumo_id=insumo_id,
        insumo_nome=insumo.nome,
        tipo=body.tipo,
        quantidade=body.quantidade,
        obra_destino=body.obra_destino if body.tipo == "Saida" else "",
        data=date.today().isoformat(),
        responsavel=current_user.login,
        observacoes=body.observacoes,
    )
    db.add(mov)
    await db.commit()
    await db.refresh(insumo)
    await db.refresh(mov)
    return {"insumo": insumo, "movimentacao": mov}
