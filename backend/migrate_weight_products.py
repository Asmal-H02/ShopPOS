import sqlite3
import shutil
import os


DB_PATH = "shoppos.db"
BACKUP_PATH = "shoppos_backup.db"


# ============================================================
# EXTRA SAFETY BACKUP
# ============================================================

if not os.path.exists(DB_PATH):
    raise FileNotFoundError("shoppos.db not found")

shutil.copy2(DB_PATH, "shoppos_backup_before_weight_migration.db")

print("Safety backup created.")


# ============================================================
# CONNECT TO DATABASE
# ============================================================

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

cursor.execute("PRAGMA foreign_keys=OFF")

try:

    # --------------------------------------------------------
    # Create new products table
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE products_new (
            id INTEGER NOT NULL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            barcode VARCHAR(50),
            product_type VARCHAR(20) NOT NULL DEFAULT 'unit',
            price FLOAT NOT NULL,
            cost_price FLOAT NOT NULL DEFAULT 0,
            stock FLOAT NOT NULL DEFAULT 0,
            reorder_level FLOAT NOT NULL DEFAULT 10,
            category_id INTEGER NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY(category_id) REFERENCES categories (id)
        )
    """)

    # --------------------------------------------------------
    # Copy existing products
    # All existing products become "unit" products
    # --------------------------------------------------------

    cursor.execute("""
        INSERT INTO products_new (
            id,
            name,
            barcode,
            product_type,
            price,
            cost_price,
            stock,
            reorder_level,
            category_id,
            created_at,
            updated_at
        )
        SELECT
            id,
            name,
            barcode,
            'unit',
            price,
            cost_price,
            stock,
            reorder_level,
            category_id,
            created_at,
            updated_at
        FROM products
    """)

    # --------------------------------------------------------
    # Replace old table
    # --------------------------------------------------------

    cursor.execute("DROP TABLE products")

    cursor.execute("""
        ALTER TABLE products_new
        RENAME TO products
    """)

    # --------------------------------------------------------
    # Recreate product ID index
    # --------------------------------------------------------

    cursor.execute("""
        CREATE INDEX ix_products_id
        ON products (id)
    """)

       # --------------------------------------------------------
    # Recreate unique barcode constraint
    # --------------------------------------------------------

    cursor.execute("""
        CREATE UNIQUE INDEX ix_products_barcode_unique
        ON products (barcode)
    """)

    conn.commit()

    print("Product table migration completed successfully.")

except Exception as e:

    conn.rollback()

    print("Migration failed.")
    print(e)

    raise

finally:

    cursor.execute("PRAGMA foreign_keys=ON")

    conn.close()


# ============================================================
# VERIFY
# ============================================================

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("\nProducts table structure:")

for column in cursor.execute("PRAGMA table_info(products)"):
    print(column)

print("\nProduct count:")

count = cursor.execute(
    "SELECT COUNT(*) FROM products"
).fetchone()[0]

print(count)

print("\nProduct types:")

for row in cursor.execute("""
    SELECT product_type, COUNT(*)
    FROM products
    GROUP BY product_type
"""):
    print(row)

conn.close()

print("\nMigration finished.")