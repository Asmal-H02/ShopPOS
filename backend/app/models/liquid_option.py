from sqlalchemy import Integer, Float, String, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class LiquidOption(Base):
    __tablename__ = "liquid_options"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False
    )

    volume_ml: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    selling_price: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    barcode: Mapped[str | None] = mapped_column(
        String(50),
        unique=True,
        nullable=True
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )