from app.database import SessionLocal
from app.models.user import User
from app.auth import hash_password


db = SessionLocal()

username = "admin"
password = "Admin123"

existing_user = db.query(User).filter(User.username == username).first()

if existing_user:
    print("Admin user already exists.")
else:
    admin = User(
        username=username,
        password_hash=hash_password(password),
        role="admin",
        is_active=True
    )

    db.add(admin)
    db.commit()

    print("Admin user created successfully.")
    print("Username:", username)
    print("Password:", password)

db.close()