from app.database import SessionLocal
from app.models.user import User
from app.auth import hash_password


db = SessionLocal()

existing_user = db.query(User).filter(
    User.username == "cashier"
).first()

if existing_user:
    print("Cashier user already exists.")
else:
    cashier = User(
        username="cashier",
        password_hash=hash_password("Cashier123"),
        role="cashier",
        is_active=True
    )

    db.add(cashier)
    db.commit()

    print("Cashier user created successfully.")
    print("Username: cashier")
    print("Password: Cashier123")

db.close()