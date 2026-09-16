from sqlalchemy import Integer, Float, DateTime, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.database import Base


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id"),
        nullable=False
    )

    sale_id: Mapped[int | None] = mapped_column(
        ForeignKey("sales.id"),
        nullable=True
    )

    transaction_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    amount: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    customer = relationship(
        "Customer",
        backref="credit_transactions"
    )

    sale = relationship(
        "Sale",
        backref="credit_transactions"
    )