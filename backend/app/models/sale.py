from sqlalchemy import Integer, Float, DateTime, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    total_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    amount_paid: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    payment_method: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="cash"
    )

    customer_id: Mapped[int | None] = mapped_column(
        ForeignKey("customers.id"),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    items = relationship(
        "SaleItem",
        backref="sale",
        cascade="all, delete-orphan"
    )