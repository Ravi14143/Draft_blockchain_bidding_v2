import sqlite3

# Connect to the database
conn = sqlite3.connect('src/database/app.db')
cursor = conn.cursor()

# Get the list of all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

for table_name in tables:
    table = table_name[0]
    print(f"\nTable: {table}")
    
    # Fetch all rows from the table
    cursor.execute(f"SELECT * FROM {table}")
    rows = cursor.fetchall()
    
    # Fetch column names
    column_names = [description[0] for description in cursor.description]
    
    # Print column headers
    print(" | ".join(column_names))
    print("-" * 50)
    
    # Print table rows
    for row in rows:
        print(" | ".join(str(item) for item in row))

# Close the connection
conn.close()
