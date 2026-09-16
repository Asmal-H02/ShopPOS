from pydantic import BaseModel, Field


class SaleItemCreate(BaseModel):

    product_id: int = Field(
        gt=0
    )

    quantity: float = Field(
        gt=0
    )

    liquid_option_id: int | None = Field(
        default=None,
        gt=0
    )


class SaleCreate(BaseModel):

    items: list[SaleItemCreate] = Field(
        min_length=1
    )

    amount_paid: float = Field(
        ge=0
    )

    payment_method: str = Field(
        default="cash",
        pattern="^(cash|credit)$"
    )

    customer_id: int | None = Field(
        default=None,
        gt=0
    )