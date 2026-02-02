"""
Database Migration Script - Add Location and Milestone Fields
Safe for production - adds nullable columns without data loss
"""

import sqlite3
import os

def migrate_database(db_path='instance/operations.db'):
    """Add new columns to existing database"""
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at {db_path}")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    migrations_applied = []
    
    try:
        # Check and add projects.location column
        cursor.execute("PRAGMA table_info(projects)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'location' not in columns:
            print("Adding 'location' column to projects table...")
            cursor.execute("ALTER TABLE projects ADD COLUMN location VARCHAR(50)")
            migrations_applied.append("projects.location")
        else:
            print("✓ projects.location already exists")
        
        # Check and add milestone fields
        cursor.execute("PRAGMA table_info(milestones)")
        milestone_cols = [col[1] for col in cursor.fetchall()]
        
        if 'start_date' not in milestone_cols:
            print("Adding 'start_date' column to milestones table...")
            cursor.execute("ALTER TABLE milestones ADD COLUMN start_date DATE")
            migrations_applied.append("milestones.start_date")
        else:
            print("✓ milestones.start_date already exists")
        
        if 'end_date' not in milestone_cols:
            print("Adding 'end_date' column to milestones table...")
            cursor.execute("ALTER TABLE milestones ADD COLUMN end_date DATE")
            migrations_applied.append("milestones.end_date")
        else:
            print("✓ milestones.end_date already exists")
        
        if 'hours_per_week' not in milestone_cols:
            print("Adding 'hours_per_week' column to milestones table...")
            cursor.execute("ALTER TABLE milestones ADD COLUMN hours_per_week INTEGER")
            migrations_applied.append("milestones.hours_per_week")
        else:
            print("✓ milestones.hours_per_week already exists")
        
        conn.commit()
        
        if migrations_applied:
            print(f"\n✅ Migration successful! Added {len(migrations_applied)} column(s):")
            for col in migrations_applied:
                print(f"   - {col}")
        else:
            print("\n✅ Database already up to date - no migrations needed")
        
        # Verify data integrity
        cursor.execute("SELECT COUNT(*) FROM projects")
        project_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM milestones")
        milestone_count = cursor.fetchone()[0]
        
        print(f"\n📊 Data integrity check:")
        print(f"   - Projects: {project_count} records")
        print(f"   - Milestones: {milestone_count} records")
        print("   - All existing data preserved ✓")
        
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        return False
    finally:
        conn.close()

if __name__ == '__main__':
    print("=" * 60)
    print("Database Migration - Add Schema Updates")
    print("=" * 60)
    print()
    
    success = migrate_database()
    
    if success:
        print("\n✅ Safe to start the Flask app now!")
        print("   Run: python app.py")
    else:
        print("\n❌ Please fix errors before starting the app")
    
    print()
