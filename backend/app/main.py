from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.models.product import Product
from app.models.category import Category
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.liquid_option import LiquidOption

from app.routers.products import router as product_router
from app.routers.categories import router as category_router
from app.routers.sales import router as sales_router
from app.routes.auth import router as auth_router
from app.routers import customers
from app.routers.liquid_options import router as liquid_options_router

from app.models.user import User
from app.models.customer import Customer
from app.models.credit_transaction import CreditTransaction


Base.metadata.create_all(bind=engine)

app = FastAPI(title="ShopPOS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(product_router)
app.include_router(category_router)
app.include_router(sales_router)
app.include_router(auth_router)
app.include_router(customers.router)
app.include_router(liquid_options_router)

@app.get("/")
def root():
    return {"message": "ShopPOS API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}