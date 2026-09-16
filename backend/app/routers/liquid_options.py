from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.product import Product
from app.models.liquid_option import LiquidOption

from app.schemas.liquid_option import (
    LiquidOptionCreate,
    LiquidOptionUpdate
)

from app.dependencies import (
    get_current_user,
    require_admin
)


router = APIRouter(
    prefix="/liquid-options",
    tags=["Liquid Options"]
)


# ============================================================
# VIEW LIQUID OPTIONS
# ADMIN + CASHIER
# ============================================================

@router.get("/product/{product_id}")
def get_liquid_options(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if product.product_type != "liquid":
        raise HTTPException(
            status_code=400,
            detail="Product is not a liquid product"
        )

    options = db.query(LiquidOption).filter(
        LiquidOption.product_id == product_id
    ).order_by(
        LiquidOption.volume_ml.asc()
    ).all()

    return options


# ============================================================
# ADMIN ONLY - CREATE LIQUID OPTION
# ============================================================

@router.post("/product/{product_id}")
def create_liquid_option(
    product_id: int,
    option_data: LiquidOptionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if product.product_type != "liquid":
        raise HTTPException(
            status_code=400,
            detail="Product is not a liquid product"
        )

    existing_option = db.query(LiquidOption).filter(
        LiquidOption.product_id == product_id,
        LiquidOption.volume_ml == option_data.volume_ml
    ).first()

    if existing_option:
        raise HTTPException(
            status_code=400,
            detail=f"{option_data.volume_ml}ml option already exists"
        )

    option = LiquidOption(
        product_id=product_id,
        volume_ml=option_data.volume_ml,
        selling_price=option_data.selling_price,
        barcode=option_data.barcode,
        active=True
    )

    db.add(option)

    try:
        db.commit()
        db.refresh(option)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Barcode already exists"
        )

    return option


# ============================================================
# ADMIN ONLY - UPDATE LIQUID OPTION
# ============================================================

@router.put("/{option_id}")
def update_liquid_option(
    option_id: int,
    option_data: LiquidOptionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    option = db.query(LiquidOption).filter(
        LiquidOption.id == option_id
    ).first()

    if not option:
        raise HTTPException(
            status_code=404,
            detail="Liquid option not found"
        )

    if option_data.volume_ml is not None:

        existing_option = db.query(LiquidOption).filter(
            LiquidOption.product_id == option.product_id,
            LiquidOption.volume_ml == option_data.volume_ml,
            LiquidOption.id != option.id
        ).first()

        if existing_option:
            raise HTTPException(
                status_code=400,
                detail=f"{option_data.volume_ml}ml option already exists"
            )

        option.volume_ml = option_data.volume_ml

    if option_data.selling_price is not None:
        option.selling_price = option_data.selling_price

    if option_data.barcode is not None:
        option.barcode = option_data.barcode

    if option_data.active is not None:
        option.active = option_data.active

    try:
        db.commit()
        db.refresh(option)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Barcode already exists"
        )

    return option