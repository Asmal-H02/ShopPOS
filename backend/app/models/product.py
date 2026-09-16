from sqlalchemy import String, Integer, Float, DateTime, ForeignKey
from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    barcode: Mapped[str | None] = mapped_column(
        String(50),
        unique=True,
        nullable=True
    )

    product_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="unit"
    )

    price: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    cost_price: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0
    )

    stock: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False
    )

    reorder_level: Mapped[float] = mapped_column(
        Float,
        default=10,
        nullable=False
    )

    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id"),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        onupdate=datetime.now,
        nullable=False
    )
    liquid_options = relationship(
        "LiquidOption",
        backref="product",
        cascade="all, delete-orphan"
    )