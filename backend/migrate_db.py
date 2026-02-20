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
            print(f"Error adding {col_name} to {table}: {e}")

# Product columns
add_column('products', 'calories', 'FLOAT')
add_column('products', 'proteins', 'FLOAT')
add_column('products', 'fats', 'FLOAT')
add_column('products', 'carbs', 'FLOAT')
add_column('products', 'ingredients', 'TEXT')
add_column('products', 'is_hot', 'BOOLEAN DEFAULT 0')

# User columns
add_column('users', 'display_name', 'TEXT')

# Order columns
add_column('orders', 'maps_url', 'TEXT')
add_column('orders', 'contact_info', 'TEXT')
add_column('orders', 'receipt_url', 'TEXT')
add_column('orders', 'updated_at', 'DATETIME')

# OrderItem columns
add_column('order_items', 'options', 'JSON')

# AppSettings columns
add_column('app_settings', 'updated_at', 'DATETIME')

# Fix any null updated_at
now = datetime.datetime.utcnow().isoformat()
try:
    cursor.execute(f"UPDATE orders SET updated_at = '{now}' WHERE updated_at IS NULL")
    print("Updated orders.updated_at")
except: pass

try:
    cursor.execute(f"UPDATE app_settings SET updated_at = '{now}' WHERE updated_at IS NULL")
    print("Updated app_settings.updated_at")
except: pass

conn.commit()
conn.close()
print("Migration complete")
