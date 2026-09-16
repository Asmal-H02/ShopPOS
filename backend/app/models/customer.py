from sqlalchemy import Integer, String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    address: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    sales = relationship(
        "Sale",
        backref="customer"
    )