from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.product import Product

from app.schemas import product
from app.schemas.stock import StockUpdate, LiquidRestock
from app.schemas.product import ProductCreate
from app.schemas.product_update import ProductUpdate

from app.dependencies import get_current_user, require_admin


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


# ============================================================
# ADMIN ONLY - CREATE PRODUCT
# ============================================================

@router.post("/")
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    product = Product(
    name=product_data.name,
    barcode=product_data.barcode,
    product_type=product_data.product_type,
    price=product_data.price,
    cost_price=product_data.cost_price,
    stock=product_data.stock,
    reorder_level=product_data.reorder_level,
    category_id=product_data.category_id
)

    db.add(product)

    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Category not found"
        )

    return product


# ============================================================
# ADMIN + CASHIER - VIEW PRODUCTS
# ============================================================

@router.get("/")
def get_products(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(Product).all()


@router.get("/barcode/{barcode}")
def get_product_by_barcode(
    barcode: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    product = db.query(Product).filter(
        Product.barcode == barcode
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


@router.get("/search/{name}")
def search_products(
    name: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    products = db.query(Product).filter(
        Product.name.ilike(f"%{name}%")
    ).all()

    return products


@router.get("/alerts/stock")
def get_stock_alerts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    products = db.query(Product).filter(
        Product.stock <= Product.reorder_level
    ).all()

    return {
        "total_alerts": len(products),
        "products": [
            {
                "product_id": product.id,
                "product_name": product.name,
                "stock": product.stock,
                "reorder_level": product.reorder_level
            }
            for product in products
        ]
    }


@router.get("/low-stock/{threshold}")
def get_low_stock_products(
    threshold: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    products = db.query(Product).filter(
        Product.stock <= threshold
    ).all()

    return products


@router.get("/inventory/value")
def get_inventory_value(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    products = db.query(Product).all()

    total_inventory_value = 0
    product_values = []

    for product in products:
        stock_value = product.price * product.stock

        total_inventory_value += stock_value

        product_values.append({
            "product_id": product.id,
            "product_name": product.name,
            "stock": product.stock,
            "unit_price": product.price,
            "stock_value": stock_value
        })

    return {
        "total_inventory_value": total_inventory_value,
        "products": product_values
    }


@router.get("/{product_id}")
def get_product(
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

    return product


# ============================================================
# ADMIN ONLY - STOCK OPERATIONS
# ============================================================

@router.patch("/{product_id}/stock")
def update_stock(
    product_id: int,
    stock_data: StockUpdate,
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

        # --------------------------------------------------------
    # UNIT PRODUCT
    # --------------------------------------------------------

    if product.product_type == "unit":

        if not float(stock_data.quantity).is_integer():
            raise HTTPException(
                status_code=400,
                detail=f"{product.name} must use whole-unit quantities"
            )

        quantity = int(stock_data.quantity)

    # --------------------------------------------------------
    # WEIGHT PRODUCT
    # --------------------------------------------------------

    elif product.product_type == "weight":

        quantity = float(stock_data.quantity)

    # --------------------------------------------------------
    # LIQUID PRODUCT
    # Quantity is already supplied in litres
    # --------------------------------------------------------

    elif product.product_type == "liquid":

        quantity = float(stock_data.quantity)

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid product type for {product.name}"
        )

    product.stock -= quantity

    db.commit()
    db.refresh(product)

    return product


@router.patch("/{product_id}/restock")
def restock_product(
    product_id: int,
    stock_data: StockUpdate,
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

    # --------------------------------------------------------
    # LIQUID PRODUCT
    # --------------------------------------------------------

    if product.product_type == "liquid":
        raise HTTPException(
            status_code=400,
            detail="Liquid products must be restocked using the liquid restock endpoint"
        )

    # --------------------------------------------------------
    # UNIT PRODUCT
    # --------------------------------------------------------

    if product.product_type == "unit":

        if not float(stock_data.quantity).is_integer():
            raise HTTPException(
                status_code=400,
                detail=f"{product.name} must use whole-unit quantities"
            )

        quantity = int(stock_data.quantity)

    # --------------------------------------------------------
    # WEIGHT PRODUCT
    # --------------------------------------------------------

    elif product.product_type == "weight":

        quantity = float(stock_data.quantity)

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid product type for {product.name}"
        )

    product.stock += quantity

    db.commit()
    db.refresh(product)

    return product
# ============================================================
# ADMIN ONLY - LIQUID RESTOCK
# ============================================================

@router.patch("/{product_id}/liquid-restock")
def liquid_restock_product(
    product_id: int,
    stock_data: LiquidRestock,
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

    # --------------------------------------------------------
    # CONVERT KG TO LITRES
    # --------------------------------------------------------

    KG_TO_LITRES = 1.082

    litres_added = stock_data.quantity_kg * KG_TO_LITRES

    # --------------------------------------------------------
    # UPDATE STOCK
    # --------------------------------------------------------

    product.stock += litres_added

    # --------------------------------------------------------
    # UPDATE CURRENT COST PER KG
    # --------------------------------------------------------

    product.cost_price = stock_data.cost_per_kg

    db.commit()
    db.refresh(product)

    return {
        "product_id": product.id,
        "product_name": product.name,
        "quantity_added_kg": stock_data.quantity_kg,
        "litres_added": litres_added,
        "current_stock_litres": product.stock,
        "cost_per_kg": product.cost_price
    }


# ============================================================
# ADMIN ONLY - UPDATE PRODUCT
# ============================================================

@router.put("/{product_id}")
def update_product(
    product_id: int,
    product_data: ProductCreate,
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

    product.name = product_data.name
    product.barcode = product_data.barcode
    product.product_type = product_data.product_type
    product.price = product_data.price
    product.stock = product_data.stock
    product.cost_price = product_data.cost_price
    product.reorder_level = product_data.reorder_level
    product.category_id = product_data.category_id

    db.commit()
    db.refresh(product)

    return product


@router.patch("/{product_id}")
def update_product_partial(
    product_id: int,
    product_data: ProductUpdate,
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

    if product_data.name is not None:
        product.name = product_data.name

    if product_data.barcode is not None:
        product.barcode = product_data.barcode

    if product_data.product_type is not None:
        product.product_type = product_data.product_type

    if product_data.price is not None:
        product.price = product_data.price

    if product_data.category_id is not None:
        product.category_id = product_data.category_id

    if product_data.cost_price is not None:
        product.cost_price = product_data.cost_price

    if product_data.reorder_level is not None:
        product.reorder_level = product_data.reorder_level

    db.commit()
    db.refresh(product)

    return product


# ============================================================
# ADMIN ONLY - DELETE PRODUCT
# ============================================================

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
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

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully"
    }