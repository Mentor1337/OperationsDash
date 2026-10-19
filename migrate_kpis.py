"""
Database Migration Script - Add KPI Scorecard Tables
Safe for production - creates new tables without affecting existing data
"""

import sqlite3
import os

def migrate_database(db_path='instance/operations.db'):
    """Create KPI tables if they don't exist"""

    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        print("The tables will be created automatically when you run app.py")
        return True

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    tables_created = []

    try:
        # Check if metrics table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='metrics'")
        if not cursor.fetchone():
            print("Creating 'metrics' table...")
            cursor.execute("""
                CREATE TABLE metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    metric_id VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(200) NOT NULL,
                    unit VARCHAR(50),
                    uom VARCHAR(20),
                    direction VARCHAR(10) DEFAULT 'up',
                    description TEXT,
                    slide_label VARCHAR(100),
                    parent_id INTEGER REFERENCES metrics(id),
                    calc_method VARCHAR(20),
                    sort_order INTEGER DEFAULT 0
                )
            """)
            tables_created.append("metrics")
        else:
            print("metrics table already exists")

        # Check if metric_values table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='metric_values'")
        if not cursor.fetchone():
            print("Creating 'metric_values' table...")
            cursor.execute("""
                CREATE TABLE metric_values (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    metric_id INTEGER NOT NULL REFERENCES metrics(id),
                    year_month VARCHAR(7) NOT NULL,
                    target FLOAT,
                    actual FLOAT,
                    UNIQUE(metric_id, year_month)
                )
            """)
            tables_created.append("metric_values")
        else:
            print("metric_values table already exists")

        # Check if metric_comments table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='metric_comments'")
        if not cursor.fetchone():
            print("Creating 'metric_comments' table...")
            cursor.execute("""
                CREATE TABLE metric_comments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    metric_id INTEGER NOT NULL REFERENCES metrics(id),
                    year_month VARCHAR(7) NOT NULL,
                    author VARCHAR(100),
                    created_at DATE,
                    text TEXT NOT NULL
                )
            """)
            tables_created.append("metric_comments")
        else:
            print("metric_comments table already exists")

        conn.commit()

        if tables_created:
            print(f"\nMigration successful! Created {len(tables_created)} table(s):")
            for table in tables_created:
                print(f"   - {table}")
        else:
            print("\nDatabase already up to date - no migrations needed")

        # Show existing data counts
        cursor.execute("SELECT COUNT(*) FROM metrics")
        metric_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM metric_values")
        value_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM metric_comments")
        comment_count = cursor.fetchone()[0]

        print(f"\nKPI data status:")
        print(f"   - Metrics: {metric_count} records")
        print(f"   - Values: {value_count} records")
        print(f"   - Comments: {comment_count} records")

        return True

    except Exception as e:
        conn.rollback()
        print(f"\nMigration failed: {e}")
        return False
    finally:
        conn.close()

if __name__ == '__main__':
    print("=" * 60)
    print("Database Migration - Add KPI Scorecard Tables")
    print("=" * 60)
    print()

    success = migrate_database()

    if success:
        print("\nSafe to start the Flask app now!")
        print("   Run: python app.py")
    else:
        print("\nPlease fix errors before starting the app")

    print()
