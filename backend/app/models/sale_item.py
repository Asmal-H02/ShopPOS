from sqlalchemy import Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SaleItem(Base):
    __tablename__ = "sale_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    sale_id: Mapped[int] = mapped_column(
        ForeignKey("sales.id"),
        nullable=False
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"),
        nullable=False
    )

    quantity: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    # For liquid products, stores the package size sold
    # Example: 175, 350, or 750
    # NULL for unit and weight products
    volume_ml: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    unit_price: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    cost_price: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    subtotal: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )