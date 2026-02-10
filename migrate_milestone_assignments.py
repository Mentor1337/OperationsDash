"""
Migration Script - Add MilestoneAssignment table and calculate milestone date ranges

This script:
1. Creates the milestone_assignments table
2. Calculates start_date/end_date for all milestones based on planned_date ordering
"""

import sqlite3
import os

def migrate_database(db_path='instance/operations.db'):
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return False

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Create milestone_assignments table
        print("Creating milestone_assignments table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS milestone_assignments (
                id INTEGER PRIMARY KEY,
                milestone_id INTEGER NOT NULL,
                engineer_id INTEGER NOT NULL,
                hours_per_week INTEGER NOT NULL,
                FOREIGN KEY (milestone_id) REFERENCES milestones(id),
                FOREIGN KEY (engineer_id) REFERENCES engineers(id),
                UNIQUE (milestone_id, engineer_id)
            )
        ''')
        print("Table created successfully.")

        # 2. Calculate milestone date ranges for existing projects
        print("\nCalculating milestone date ranges...")

        cursor.execute('SELECT id, start_date FROM projects WHERE start_date IS NOT NULL')
        projects = cursor.fetchall()

        updated_count = 0
        for project_id, project_start in projects:
            # Get milestones sorted by planned_date
            cursor.execute('''
                SELECT id, planned_date FROM milestones
                WHERE project_id = ?
                ORDER BY planned_date
            ''', (project_id,))
            milestones = cursor.fetchall()

            if not milestones:
                continue

            # Calculate date ranges
            prev_date = project_start
            for milestone_id, planned_date in milestones:
                cursor.execute('''
                    UPDATE milestones
                    SET start_date = ?, end_date = ?
                    WHERE id = ?
                ''', (prev_date, planned_date, milestone_id))
                prev_date = planned_date
                updated_count += 1

        print(f"Updated date ranges for {updated_count} milestones.")

        conn.commit()
        print("\nMigration completed successfully!")
        return True

    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        return False
    finally:
        conn.close()


if __name__ == '__main__':
    migrate_database()
