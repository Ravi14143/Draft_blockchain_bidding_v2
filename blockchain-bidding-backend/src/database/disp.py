from sqlalchemy import create_engine, MetaData, Table
from sqlalchemy.orm import sessionmaker

# Path to your SQLite file
DB_FILE = "app.db"  # change to your file name
engine = create_engine(f"sqlite:///{DB_FILE}")

# Reflect the existing database
metadata = MetaData()
metadata.reflect(bind=engine)

# Create a session
Session = sessionmaker(bind=engine)
session = Session()

# Iterate over all tables and print contents
for table_name, table in metadata.tables.items():
    print(f"\n=== Table: {table_name} ===")
    rows = session.execute(table.select()).fetchall()
    if rows:
        for row in rows:
            print(dict(row._mapping))  # Convert Row to dictionary
    else:
        print("(empty)")

session.close()
