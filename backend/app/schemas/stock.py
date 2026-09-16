from pydantic import BaseModel, Field


class StockUpdate(BaseModel):

    quantity: float = Field(
        gt=0
    )


class LiquidRestock(BaseModel):

    quantity_kg: float = Field(
        gt=0
    )

    cost_per_kg: float = Field(
        gt=0
    )