import sqlite3
import shutil
import os


DB_PATH = "shoppos.db"
BACKUP_PATH = "shoppos_backup_before_credit_migration.db"


# Safety backup
if os.path.exists(BACKUP_PATH):
    os.remove(BACKUP_PATH)

shutil.copy2(DB_PATH, BACKUP_PATH)

print("Safety backup created.")


conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()


# Check existing sales columns
cursor.execute("PRAGMA table_info(sales)")
columns = [row[1] for row in cursor.fetchall()]


# Add payment_method if it does not exist
if "payment_method" not in columns:
    cursor.execute("""
        ALTER TABLE sales
        ADD COLUMN payment_method VARCHAR(20)
        NOT NULL
        DEFAULT 'cash'
    """)

    print("Added payment_method column.")
else:
    print("payment_method already exists.")


# Add customer_id if it does not exist
if "customer_id" not in columns:
    cursor.execute("""
        ALTER TABLE sales
        ADD COLUMN customer_id INTEGER
        REFERENCES customers(id)
    """)

    print("Added customer_id column.")
else:
    print("customer_id already exists.")


conn.commit()


# Verify
cursor.execute("PRAGMA table_info(sales)")
print("\nSales table structure:")

for column in cursor.fetchall():
    print(column)


conn.close()

print("\nCredit system migration completed successfully.")