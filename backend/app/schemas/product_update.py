from pydantic import BaseModel, Field


class ProductUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100
    )

    barcode: str | None = Field(
        default=None,
        max_length=50
    )

    product_type: str | None = Field(
        default=None,
        pattern="^(unit|weight)$"
    )

    price: float | None = Field(
        default=None,
        gt=0
    )

    category_id: int | None = Field(
        default=None,
        gt=0
    )

    cost_price: float | None = Field(
        default=None,
        gt=0
    )

    reorder_level: float | None = Field(
        default=None,
        ge=0
    )