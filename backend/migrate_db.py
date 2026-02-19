import sqlite3
import datetime

db_path = '7eleven.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def add_column(table, col_name, col_type):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}")
        print(f"Added column {col_name} to {table}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"Column {col_name} already exists in {table}")
        else:
            print(f"Error adding {col_name}: {e}")

add_column('orders', 'maps_url', 'TEXT')
add_column('orders', 'receipt_url', 'TEXT')
add_column('orders', 'updated_at', 'DATETIME')
add_column('app_settings', 'updated_at', 'DATETIME') # Also check app_settings just in case

# Fix any null updated_at
now = datetime.datetime.utcnow().isoformat()
cursor.execute(f"UPDATE orders SET updated_at = '{now}' WHERE updated_at IS NULL")
cursor.execute(f"UPDATE app_settings SET updated_at = '{now}' WHERE updated_at IS NULL")

conn.commit()
conn.close()
print("Migration complete")
