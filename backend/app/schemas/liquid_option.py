from pydantic import BaseModel, Field


class LiquidOptionCreate(BaseModel):

    volume_ml: int = Field(
        gt=0
    )

    selling_price: float = Field(
        gt=0
    )

    barcode: str | None = Field(
        default=None,
        max_length=50
    )


class LiquidOptionUpdate(BaseModel):

    volume_ml: int | None = Field(
        default=None,
        gt=0
    )

    selling_price: float | None = Field(
        default=None,
        gt=0
    )

    barcode: str | None = Field(
        default=None,
        max_length=50
    )

    active: bool | None = None