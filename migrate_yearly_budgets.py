"""
Database Migration Script - Add Project Yearly Budgets Table
Safe for production - creates new table without data loss
"""

import sqlite3
import os

def migrate_database(db_path='instance/operations.db'):
    """Add project_yearly_budgets table to existing database"""

    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return False

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='project_yearly_budgets'")
        if cursor.fetchone():
            print("project_yearly_budgets table already exists")
        else:
            print("Creating project_yearly_budgets table...")
            cursor.execute("""
                CREATE TABLE project_yearly_budgets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id INTEGER NOT NULL,
                    year INTEGER NOT NULL,
                    amount FLOAT NOT NULL DEFAULT 0,
                    FOREIGN KEY (project_id) REFERENCES projects(id),
                    UNIQUE (project_id, year)
                )
            """)
            print("project_yearly_budgets table created successfully")

        conn.commit()
        print("Migration completed successfully!")
        return True

    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == '__main__':
    migrate_database()
