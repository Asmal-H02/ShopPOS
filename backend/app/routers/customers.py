from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.customer import Customer
from app.dependencies import (get_current_user,require_admin,require_admin_or_cashier)
from app.models.credit_transaction import CreditTransaction

router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)


# ============================================================
# SEARCH CUSTOMERS
# ============================================================

@router.get("/")
def get_customers(
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(Customer)

    if search:
        query = query.filter(
            Customer.name.ilike(f"%{search}%")
        )

    customers = query.order_by(Customer.name.asc()).all()

    return [
        {
            "id": customer.id,
            "name": customer.name,
            "phone": customer.phone,
            "address": customer.address,
        }
        for customer in customers
    ]


# ============================================================
# GET SINGLE CUSTOMER
# ============================================================

@router.get("/{customer_id}")
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return {
        "id": customer.id,
        "name": customer.name,
        "phone": customer.phone,
        "address": customer.address,
    }


# ============================================================
# CREATE CUSTOMER
# ============================================================

@router.post("/")
def create_customer(
    name: str,
    phone: str | None = None,
    address: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    name = name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Customer name is required"
        )

    customer = Customer(
        name=name,
        phone=phone,
        address=address
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return {
        "id": customer.id,
        "name": customer.name,
        "phone": customer.phone,
        "address": customer.address,
    }

# ============================================================
# CUSTOMER CREDIT SUMMARY
# ============================================================

@router.get("/{customer_id}/credit")
def get_customer_credit(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    transactions = db.query(CreditTransaction).filter(
        CreditTransaction.customer_id == customer_id
    ).order_by(
        CreditTransaction.created_at.desc()
    ).all()

    total_credit = sum(
        transaction.amount
        for transaction in transactions
        if transaction.transaction_type == "credit"
    )

    total_paid = sum(
        transaction.amount
        for transaction in transactions
        if transaction.transaction_type == "payment"
    )

    outstanding = total_credit - total_paid

    return {
        "customer_id": customer.id,
        "customer_name": customer.name,
        "total_credit": total_credit,
        "total_paid": total_paid,
        "outstanding": outstanding,
        "transactions": [
            {
                "id": transaction.id,
                "sale_id": transaction.sale_id,
                "transaction_type": transaction.transaction_type,
                "amount": transaction.amount,
                "created_at": transaction.created_at
            }
            for transaction in transactions
        ]
    }

# ============================================================
# RECORD CUSTOMER PAYMENT
# ============================================================

@router.post("/{customer_id}/payment")
def record_customer_payment(
    customer_id: int,
    amount: float,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_cashier)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    if amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Payment amount must be greater than zero"
        )

    # --------------------------------------------------------
    # Calculate current outstanding balance
    # --------------------------------------------------------

    transactions = db.query(CreditTransaction).filter(
        CreditTransaction.customer_id == customer_id
    ).all()

    total_credit = sum(
        transaction.amount
        for transaction in transactions
        if transaction.transaction_type == "credit"
    )

    total_paid = sum(
        transaction.amount
        for transaction in transactions
        if transaction.transaction_type == "payment"
    )

    outstanding = total_credit - total_paid

    # --------------------------------------------------------
    # Prevent overpayment
    # --------------------------------------------------------

    if amount > outstanding:
        raise HTTPException(
            status_code=400,
            detail=f"Payment exceeds outstanding balance of Rs. {outstanding:.2f}"
        )

    # --------------------------------------------------------
    # Create payment transaction
    # --------------------------------------------------------

    payment = CreditTransaction(
        customer_id=customer_id,
        sale_id=None,
        transaction_type="payment",
        amount=amount
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    # --------------------------------------------------------
    # Calculate remaining balance
    # --------------------------------------------------------

    remaining_balance = outstanding - amount

    return {
        "message": "Payment recorded successfully",
        "customer_id": customer.id,
        "customer_name": customer.name,
        "payment_amount": amount,
        "remaining_balance": remaining_balance,
        "transaction_id": payment.id,
        "created_at": payment.created_at
    }