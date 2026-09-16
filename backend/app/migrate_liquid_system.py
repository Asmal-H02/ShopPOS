import sqlite3

DATABASE = "shoppos.db"


def column_exists(cursor, table_name, column_name):
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()

    return any(
        column[1] == column_name
        for column in columns
    )


def main():
    connection = sqlite3.connect(DATABASE)
    cursor = connection.cursor()

    # --------------------------------------------------------
    # Add volume_ml to existing sale_items table
    # --------------------------------------------------------

    if not column_exists(
        cursor,
        "sale_items",
        "volume_ml"
    ):
        cursor.execute("""
            ALTER TABLE sale_items
            ADD COLUMN volume_ml INTEGER
        """)

        print("Added volume_ml to sale_items")
    else:
        print("volume_ml already exists")

    connection.commit()
    connection.close()

    print("Liquid system migration completed successfully.")


if __name__ == "__main__":
    main()