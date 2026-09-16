from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate

from app.dependencies import get_current_user, require_admin

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)


@router.post("/")
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    category = Category(
        name=category_data.name
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return category


@router.get("/")
def get_categories(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(Category).all()


@router.get("/{category_id}")
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    return category


@router.put("/{category_id}")
def update_category(
    category_id: int,
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    category.name = category_data.name

    db.commit()
    db.refresh(category)

    return category


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    db.delete(category)
    db.commit()

    return {"message": "Category deleted successfully"}