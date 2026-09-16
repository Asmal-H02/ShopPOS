from pydantic import BaseModel, Field


class ProductCreate(BaseModel):

    name: str = Field(
        min_length=1,
        max_length=100
    )

    barcode: str | None = Field(
        default=None,
        max_length=50
    )

    product_type: str = Field(
        default="unit",
        pattern="^(unit|weight|liquid)$"
    )

    price: float = Field(
        gt=0
    )

    cost_price: float = Field(
        gt=0
    )

    stock: float = Field(
        ge=0
    )

    reorder_level: float = Field(
        ge=0
    )

    category_id: int = Field(
        gt=0
    )