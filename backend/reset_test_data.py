"""
ShopPOS - Test Data Reset

This script clears:
    - All sales
    - All sale items
    - All credit transactions
    - All customer credit balances

It DOES NOT modify:
    - Products
    - Product stock
    - Categories
    - Customers
    - Users / Admin / Cashier accounts

Use this only for local development/testing.
"""

import sqlite3
from pathlib import Path


# ---------------------------------------------------------
# DATABASE LOCATION
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "shoppos.db"


# ---------------------------------------------------------
# SAFETY CHECK
# ---------------------------------------------------------

print("=" * 60)
print("SHOPPOS TEST DATA RESET")
print("=" * 60)

print(f"\nDatabase:")
print(DB_PATH)

if not DB_PATH.exists():
    print("\nERROR: shoppos.db was not found.")
    print("Make sure this script is inside:")
    print(r"C:\ShopPOS\backend")
    raise SystemExit(1)


# ---------------------------------------------------------
# CONFIRMATION
# ---------------------------------------------------------

print("\nThis will permanently delete TEST TRANSACTION DATA:")

print("  - All sales")
print("  - All sale items")
print("  - All credit transactions")
print("  - All customer credit balances")

print("\nIt will NOT delete:")
print("  - Products")
print("  - Product stock")
print("  - Categories")
print("  - Customers")
print("  - Admin/Cashier users")

confirmation = input(
    "\nType RESET to continue: "
).strip()

if confirmation != "RESET":
    print("\nReset cancelled.")
    raise SystemExit(0)


# ---------------------------------------------------------
# DATABASE CONNECTION
# ---------------------------------------------------------

try:
    db = sqlite3.connect(DB_PATH)
    db.execute("PRAGMA foreign_keys = ON")

    cursor = db.cursor()

    # -----------------------------------------------------
    # CHECK WHICH TABLES EXIST
    # -----------------------------------------------------

    tables = {
        row[0]
        for row in cursor.execute(
            """
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
            """
        ).fetchall()
    }

    required_tables = {
        "sales",
        "sale_items",
    }

    missing_tables = required_tables - tables

    if missing_tables:
        print(
            "\nERROR: Expected tables were not found:"
        )
        for table in missing_tables:
            print(f"  - {table}")

        db.close()
        raise SystemExit(1)

    # -----------------------------------------------------
    # COUNT CURRENT DATA
    # -----------------------------------------------------

    sales_count = cursor.execute(
        "SELECT COUNT(*) FROM sales"
    ).fetchone()[0]

    sale_items_count = cursor.execute(
        "SELECT COUNT(*) FROM sale_items"
    ).fetchone()[0]

    credit_transactions_count = 0

    if "credit_transactions" in tables:
        credit_transactions_count = cursor.execute(
            "SELECT COUNT(*) FROM credit_transactions"
        ).fetchone()[0]

    print("\nCurrent transaction data:")
    print(f"  Sales:               {sales_count}")
    print(f"  Sale items:          {sale_items_count}")
    print(f"  Credit transactions: {credit_transactions_count}")

    # -----------------------------------------------------
    # START TRANSACTION
    # -----------------------------------------------------

    cursor.execute("BEGIN")

    # -----------------------------------------------------
    # DELETE CREDIT TRANSACTIONS
    # -----------------------------------------------------

    if "credit_transactions" in tables:
        cursor.execute(
            "DELETE FROM credit_transactions"
        )

    # -----------------------------------------------------
    # DELETE SALE ITEMS FIRST
    # -----------------------------------------------------
    # Sale items reference sales, so they should be removed
    # before the parent sale records.

    cursor.execute(
        "DELETE FROM sale_items"
    )

    # -----------------------------------------------------
    # DELETE SALES
    # -----------------------------------------------------

    cursor.execute(
        "DELETE FROM sales"
    )

    # -----------------------------------------------------
    # RESET CUSTOMER CREDIT
    # -----------------------------------------------------
    # The script checks which customer credit column exists
    # instead of blindly assuming a column name.

    if "customers" in tables:

        customer_columns = {
            row[1]
            for row in cursor.execute(
                "PRAGMA table_info(customers)"
            ).fetchall()
        }

        # Common column names that could hold the balance.
        possible_balance_columns = [
            "credit_balance",
            "outstanding_balance",
            "balance",
            "credit",
        ]

        balance_column = next(
            (
                column
                for column in possible_balance_columns
                if column in customer_columns
            ),
            None,
        )

        if balance_column:
            cursor.execute(
                f"""
                UPDATE customers
                SET {balance_column} = 0
                """
            )

            print(
                f"\nCustomer credit column reset: "
                f"{balance_column}"
            )

        else:
            print(
                "\nNo customer balance column found."
            )
            print(
                "Customer credit may be calculated "
                "from credit transactions instead."
            )

    # -----------------------------------------------------
    # COMMIT
    # -----------------------------------------------------

    db.commit()

    # -----------------------------------------------------
    # VERIFY
    # -----------------------------------------------------

    remaining_sales = cursor.execute(
        "SELECT COUNT(*) FROM sales"
    ).fetchone()[0]

    remaining_sale_items = cursor.execute(
        "SELECT COUNT(*) FROM sale_items"
    ).fetchone()[0]

    remaining_credit_transactions = 0

    if "credit_transactions" in tables:
        remaining_credit_transactions = cursor.execute(
            "SELECT COUNT(*) FROM credit_transactions"
        ).fetchone()[0]

    print("\n" + "=" * 60)
    print("RESET COMPLETED SUCCESSFULLY")
    print("=" * 60)

    print("\nRemaining transaction data:")
    print(f"  Sales:               {remaining_sales}")
    print(f"  Sale items:          {remaining_sale_items}")
    print(
        f"  Credit transactions: "
        f"{remaining_credit_transactions}"
    )

    print("\nKept untouched:")
    print("  ✓ Products")
    print("  ✓ Product stock")
    print("  ✓ Categories")
    print("  ✓ Customers")
    print("  ✓ Admin/Cashier accounts")

    print("\nYou now have a clean transaction history for testing.")

except Exception as error:
    # -----------------------------------------------------
    # ROLLBACK ON ANY ERROR
    # -----------------------------------------------------

    try:
        db.rollback()
    except Exception:
        pass

    print("\n" + "=" * 60)
    print("RESET FAILED")
    print("=" * 60)

    print(f"\nError: {error}")
    print("\nNo partial database changes were committed.")

    raise

finally:
    try:
        db.close()
    except Exception:
        pass

