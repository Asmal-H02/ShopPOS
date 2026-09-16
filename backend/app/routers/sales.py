from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse

from sqlalchemy.orm import Session

from app.database import get_db
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.liquid_option import LiquidOption
from app.models.credit_transaction import CreditTransaction
from app.schemas.sale import SaleCreate

from app.dependencies import get_current_user, require_admin

router = APIRouter(
    prefix="/sales",
    tags=["Sales"]
)


@router.post("/")
def create_sale(
    sale_data: SaleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    total = 0
    sale_items = []

    # ========================================================
    # PAYMENT METHOD VALIDATION
    # ========================================================

    if sale_data.payment_method == "cash":

        # Cash sales must not have a customer attached
        if sale_data.customer_id is not None:
            raise HTTPException(
                status_code=400,
                detail="Customer can only be selected for credit sales"
            )

    elif sale_data.payment_method == "credit":

        # Credit sales must have a customer
        if sale_data.customer_id is None:
            raise HTTPException(
                status_code=400,
                detail="Customer is required for credit sales"
            )

        # Credit sales must have no cash paid at checkout
        if sale_data.amount_paid != 0:
            raise HTTPException(
                status_code=400,
                detail="Credit sales cannot have cash paid at checkout"
            )

    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid payment method"
        )

    # ========================================================
    # CHECK CUSTOMER FOR CREDIT SALE
    # ========================================================

    customer = None

    if sale_data.payment_method == "credit":

        from app.models.customer import Customer

        customer = db.query(Customer).filter(
            Customer.id == sale_data.customer_id
        ).first()

        if not customer:
            raise HTTPException(
                status_code=404,
                detail="Customer not found"
            )

    # ========================================================
    # CHECK ALL PRODUCTS AND STOCK FIRST
    # ========================================================

    KG_TO_LITRES = 1.082

    for item in sale_data.items:

        product = db.query(Product).filter(
            Product.id == item.product_id
        ).first()

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item.product_id} not found"
            )

        # ----------------------------------------------------
        # UNIT PRODUCT
        # ----------------------------------------------------

        if product.product_type == "unit":

            if not float(item.quantity).is_integer():
                raise HTTPException(
                    status_code=400,
                    detail=f"{product.name} must be sold in whole units"
                )

            quantity = int(item.quantity)

            if product.stock < quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product.name}"
                )

            subtotal = product.price * quantity

            total += subtotal

            sale_items.append({
                "product": product,
                "quantity": quantity,
                "volume_ml": None,
                "unit_price": product.price,
                "cost_price": product.cost_price,
                "subtotal": subtotal,
                "stock_deduction": quantity
            })

        # ----------------------------------------------------
        # WEIGHT PRODUCT
        # ----------------------------------------------------

        elif product.product_type == "weight":

            quantity = float(item.quantity)

            if product.stock < quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product.name}"
                )

            subtotal = product.price * quantity

            total += subtotal

            sale_items.append({
                "product": product,
                "quantity": quantity,
                "volume_ml": None,
                "unit_price": product.price,
                "cost_price": product.cost_price,
                "subtotal": subtotal,
                "stock_deduction": quantity
            })

        # ----------------------------------------------------
        # LIQUID PRODUCT
        # ----------------------------------------------------

        elif product.product_type == "liquid":

            # Liquid products must specify a package option
            if item.liquid_option_id is None:
                raise HTTPException(
                    status_code=400,
                    detail=f"Please select a package size for {product.name}"
                )

            # Find selected liquid option
            liquid_option = db.query(LiquidOption).filter(
                LiquidOption.id == item.liquid_option_id
            ).first()

            if not liquid_option:
                raise HTTPException(
                    status_code=404,
                    detail="Liquid option not found"
                )

            # Make sure the option belongs to this product
            if liquid_option.product_id != product.id:
                raise HTTPException(
                    status_code=400,
                    detail="Liquid option does not belong to this product"
                )

            # Do not allow inactive package options to be sold
            if not liquid_option.active:
                raise HTTPException(
                    status_code=400,
                    detail="This liquid package option is inactive"
                )

            # Package quantity must be whole numbers
            if not float(item.quantity).is_integer():
                raise HTTPException(
                    status_code=400,
                    detail=f"{product.name} package quantity must be a whole number"
                )

            package_quantity = int(item.quantity)

            # Convert selected package size into litres
            volume_litres = (
                liquid_option.volume_ml / 1000
            ) * package_quantity

            # Shared liquid stock is stored in litres
            if product.stock < volume_litres:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Insufficient stock for {product.name}. "
                        f"Required: {volume_litres:.3f} L, "
                        f"Available: {product.stock:.3f} L"
                    )
                )

            # ------------------------------------------------
            # LIQUID COST CALCULATION
            #
            # product.cost_price = current cost per kg
            #
            # 1 kg = 1.082 litres
            #
            # cost per litre = cost per kg / 1.082
            # ------------------------------------------------

            cost_per_litre = (
                product.cost_price / KG_TO_LITRES
            )

            cost_per_package = (
                cost_per_litre
                * (liquid_option.volume_ml / 1000)
            )

            # Selling price comes from the selected package
            subtotal = (
                liquid_option.selling_price
                * package_quantity
            )

            total += subtotal

            sale_items.append({
                "product": product,
                "quantity": package_quantity,
                "volume_ml": liquid_option.volume_ml,
                "unit_price": liquid_option.selling_price,
                "cost_price": cost_per_package,
                "subtotal": subtotal,
                "stock_deduction": volume_litres
            })

        # ----------------------------------------------------
        # INVALID PRODUCT TYPE
        # ----------------------------------------------------

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid product type for {product.name}"
            )

    # ========================================================
    # PAYMENT CHECK
    # ========================================================

    if sale_data.payment_method == "cash":

        if sale_data.amount_paid < total:
            raise HTTPException(
                status_code=400,
                detail="Amount paid is less than total amount"
            )

    # ========================================================
    # CREATE SALE
    # ========================================================

    sale = Sale(
        total_amount=total,
        amount_paid=sale_data.amount_paid,
        payment_method=sale_data.payment_method,
        customer_id=sale_data.customer_id
    )

    db.add(sale)
    db.flush()

    # ========================================================
    # CREATE SALE ITEMS + REDUCE STOCK
    # ========================================================

    for item in sale_items:

        product = item["product"]

        product.stock -= item["stock_deduction"]

        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            quantity=item["quantity"],
            volume_ml=item["volume_ml"],
            unit_price=item["unit_price"],
            cost_price=item["cost_price"],
            subtotal=item["subtotal"]
        )

        db.add(sale_item)

    # ========================================================
    # CREATE CREDIT TRANSACTION
    # ========================================================

    if sale_data.payment_method == "credit":

        credit_transaction = CreditTransaction(
            customer_id=sale_data.customer_id,
            sale_id=sale.id,
            transaction_type="credit",
            amount=total
        )

        db.add(credit_transaction)

    # ========================================================
    # SAVE
    # ========================================================

    db.commit()
    db.refresh(sale)

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "sale_id": sale.id,
        "total_amount": sale.total_amount,
        "amount_paid": sale.amount_paid,
        "payment_method": sale.payment_method,
        "customer_id": sale.customer_id,
        "change": (
            sale.amount_paid - sale.total_amount
            if sale.payment_method == "cash"
            else 0
        ),
        "items": [
            {
                "product_id": item.product_id,
                "product_name": db.query(Product).filter(
                    Product.id == item.product_id
                ).first().name,
                "quantity": item.quantity,
                "volume_ml": item.volume_ml,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal
            }
            for item in sale.items
        ],
        "created_at": sale.created_at
    }

@router.get("/")
def get_sales(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    sales = db.query(Sale).all()

    return [
        {
            "sale_id": sale.id,
            "total_amount": sale.total_amount,
            "amount_paid": sale.amount_paid,
            "payment_method": sale.payment_method,
            "change": (
            sale.amount_paid - sale.total_amount
            if sale.payment_method == "cash"
            else 0
            ),
            "created_at": sale.created_at,
            "items": [
    {
        "product_id": item.product_id,
        "product_name": db.query(Product).filter(
            Product.id == item.product_id
        ).first().name,
        "quantity": item.quantity,
        "unit_price": item.unit_price,
        "cost_price": item.cost_price,
        "subtotal": item.subtotal,
        "profit": (item.unit_price - item.cost_price) * item.quantity
    }
    for item in sale.items
]
        }
        for sale in sales
    ]

@router.get("/products/daily")
def get_daily_product_sales(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    from datetime import datetime, time

    today = datetime.now().date()

    start_of_day = datetime.combine(today, time.min)
    end_of_day = datetime.combine(today, time.max)

    sales = db.query(Sale).filter(
        Sale.created_at >= start_of_day,
        Sale.created_at <= end_of_day,
    ).all()

    product_sales = {}

    for sale in sales:
        for item in sale.items:
            product = db.query(Product).filter(
                Product.id == item.product_id
            ).first()

            if not product:
                continue

            if product.id not in product_sales:
                product_sales[product.id] = {
                    "product_id": product.id,
                    "product_name": product.name,
                    "quantity_sold": 0,
                    "total_revenue": 0,
                    "total_cost": 0,
                    "total_profit": 0
                }

            item_cost = item.cost_price * item.quantity
            item_profit = item.subtotal - item_cost

            product_sales[product.id]["quantity_sold"] += item.quantity
            product_sales[product.id]["total_revenue"] += item.subtotal
            product_sales[product.id]["total_cost"] += item_cost
            product_sales[product.id]["total_profit"] += item_profit

    return {
        "date": today,
        "products": list(product_sales.values())
    }


@router.get("/products/monthly")
def get_monthly_product_sales(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    from datetime import datetime

    if month < 1 or month > 12:
        raise HTTPException(
            status_code=400,
            detail="Month must be between 1 and 12"
        )

    start_of_month = datetime(year, month, 1)

    if month == 12:
        start_of_next_month = datetime(year + 1, 1, 1)
    else:
        start_of_next_month = datetime(year, month + 1, 1)

    sales = db.query(Sale).filter(
        Sale.created_at >= start_of_month,
        Sale.created_at < start_of_next_month,
    ).all()

    product_sales = {}

    for sale in sales:
        for item in sale.items:
            product = db.query(Product).filter(
                Product.id == item.product_id
            ).first()

            if not product:
                continue

            if product.id not in product_sales:
                product_sales[product.id] = {
                    "product_id": product.id,
                    "product_name": product.name,
                    "product_type": product.product_type,
                    "quantity_sold": 0,
                    "total_revenue": 0,
                    "total_cost": 0,
                    "total_profit": 0
                }

            item_cost = item.cost_price * item.quantity
            item_profit = item.subtotal - item_cost

            product_sales[product.id]["quantity_sold"] += item.quantity
            product_sales[product.id]["total_revenue"] += item.subtotal
            product_sales[product.id]["total_cost"] += item_cost
            product_sales[product.id]["total_profit"] += item_profit

    return {
        "year": year,
        "month": month,
        "products": list(product_sales.values())
    }

@router.get("/{sale_id}")
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    sale = db.query(Sale).filter(
        Sale.id == sale_id
    ).first()

    if not sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found"
        )

    items = []

    for item in sale.items:

        product = db.query(Product).filter(
            Product.id == item.product_id
        ).first()

        if not product:
            continue

        items.append({
            "product_id": item.product_id,
            "product_name": product.name,
            "product_type": product.product_type,
            "quantity": item.quantity,
            "volume_ml": item.volume_ml,
            "unit_price": item.unit_price,
            "cost_price": item.cost_price,
            "subtotal": item.subtotal,
            "profit": (
                item.unit_price - item.cost_price
            ) * item.quantity
        })

    return {
        "sale_id": sale.id,
        "total_amount": sale.total_amount,
        "amount_paid": sale.amount_paid,
        "payment_method": sale.payment_method,
        "change": (
            sale.amount_paid - sale.total_amount
            if sale.payment_method == "cash"
            else 0
        ),
        "created_at": sale.created_at,
        "items": items
    }


@router.get("/{sale_id}/receipt", response_class=PlainTextResponse)
def get_sale_receipt(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()

    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    # 80mm thermal printer text width
    WIDTH = 48

    def separator(char="-"):
        return char * WIDTH

    def center(text):
        return text.center(WIDTH)

    def money_line(label, amount):
        value = f"Rs. {amount:,.2f}"
        return f"{label:<10}{value:>{WIDTH - 10}}"

    receipt = []

    # Header
    receipt.append("=" * WIDTH)
    receipt.append(center("SIRISARA STORES"))
    receipt.append(center("No.416/2, Uduwaka, Gatahaththa"))
    receipt.append(center("Tel: +94 77 747 5305"))
    receipt.append("=" * WIDTH)

    # Sale information
    receipt.append(f"Sale ID : #{sale.id:06d}")
    receipt.append(f"Date    : {sale.created_at.strftime('%Y-%m-%d %H:%M')}")

    receipt.append(separator())
    receipt.append("ITEM")
    receipt.append(separator())

    # Items
    for item in sale.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()

        if not product:
            continue

        # Product name
        receipt.append(product.name)

        # Quantity display
        if product.product_type == "weight":

             quantity_display = f"{item.quantity:.3f} kg"

        elif product.product_type == "liquid":

            quantity_display = (
            f"{int(item.quantity)} x {item.volume_ml}ml"
    )

        else:

             quantity_display = f"{int(item.quantity)}"

        # Item pricing
        price_display = f"Rs. {item.unit_price:,.2f}"
        subtotal_display = f"Rs. {item.subtotal:,.2f}"

        if product.product_type == "liquid":
            item_line = f"{quantity_display} @ {price_display}"
        else:
            item_line = f"{quantity_display} x {price_display}"

        # Keep the amount aligned to the right
        available_width = WIDTH - len(subtotal_display) - 1

        if len(item_line) <= available_width:
            receipt.append(
                f"{item_line:<{available_width}}"
                f" {subtotal_display:>{len(subtotal_display)}}"
            )
        else:
            receipt.append(item_line)
            receipt.append(f"{subtotal_display:>{WIDTH}}")

    # Totals
    receipt.append(separator())
    receipt.append(money_line("TOTAL", sale.total_amount))
    if sale.payment_method == "cash":
        receipt.append(money_line("CASH", sale.amount_paid))
        receipt.append(
            money_line(
            "CHANGE",
            sale.amount_paid - sale.total_amount
        )
    )
    else:
        receipt.append(
        money_line("CREDIT", sale.total_amount)
    )
    receipt.append("=" * WIDTH)

    # Footer
    receipt.append(center("Thank You!"))
    receipt.append(center("Come again."))
    receipt.append("=" * WIDTH)

    return "\n".join(receipt)

@router.get("/summary/daily")
def get_daily_sales_summary(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    from datetime import datetime, time

    today = datetime.now().date()

    start_of_day = datetime.combine(today, time.min)
    end_of_day = datetime.combine(today, time.max)

    sales = db.query(Sale).filter(
        Sale.created_at >= start_of_day,
        Sale.created_at <= end_of_day,
    ).all()

    total_sales = len(sales)
    total_amount = sum(sale.total_amount for sale in sales)
    total_cash = sum(sale.amount_paid for sale in sales if sale.payment_method == "cash")
    total_change = sum(
    sale.amount_paid - sale.total_amount
    for sale in sales
    if sale.payment_method == "cash"
)

    total_cost = 0
    total_profit = 0

    for sale in sales:
        for item in sale.items:
            item_cost = item.cost_price * item.quantity
            item_profit = item.subtotal - item_cost

            total_cost += item_cost
            total_profit += item_profit

    return {
        "date": today,
        "total_sales": total_sales,
        "total_amount": total_amount,
        "total_cost": total_cost,
        "total_profit": total_profit,
        "total_cash": total_cash,
        "total_change": total_change
    }

@router.get("/summary/monthly")
def get_monthly_sales_summary(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    from datetime import datetime
    import calendar

    if month < 1 or month > 12:
        raise HTTPException(
            status_code=400,
            detail="Month must be between 1 and 12"
        )

    start_of_month = datetime(year, month, 1)

    last_day = calendar.monthrange(year, month)[1]
    start_of_next_month = (
        datetime(year + 1, 1, 1)
        if month == 12
        else datetime(year, month + 1, 1)
    )

    sales = db.query(Sale).filter(
        Sale.created_at >= start_of_month,
        Sale.created_at < start_of_next_month,
    ).all()

    total_sales = len(sales)
    total_amount = sum(
        sale.total_amount for sale in sales
    )
    total_cash = sum(
    sale.amount_paid
    for sale in sales
    if sale.payment_method == "cash"
    )
    total_change = sum(
    sale.amount_paid - sale.total_amount
    for sale in sales
    if sale.payment_method == "cash"
    )

    total_cost = 0
    total_profit = 0

    for sale in sales:
        for item in sale.items:
            item_cost = item.cost_price * item.quantity
            item_profit = item.subtotal - item_cost

            total_cost += item_cost
            total_profit += item_profit

    return {
        "year": year,
        "month": month,
        "total_sales": total_sales,
        "total_amount": total_amount,
        "total_cost": total_cost,
        "total_profit": total_profit,
        "total_cash": total_cash,
        "total_change": total_change
    }