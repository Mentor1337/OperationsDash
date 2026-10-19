# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run the application (starts Flask dev server on http://localhost:5000)
python app.py

# Database migrations (run when schema changes)
python migrate_db.py
python migrate_milestone_assignments.py
python migrate_yearly_budgets.py

# Setup (first time)
python -m venv venv
.\venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env    # Then edit .env with your values
```

## Architecture

**Stack**: Flask 3.0 backend + vanilla JavaScript frontend with Tailwind CSS

**Key Files**:
- `app.py` - Monolithic Flask application containing all 13+ SQLAlchemy models and all API routes (~2600 lines)
- `static/js/app.js` - Frontend SPA logic with state management (~4600 lines)
- `templates/index.html` - Main dashboard template with Jinja2

**Database**: SQLite by default (`instance/operations.db`), configurable via `DATABASE_URI` env var. Models use nullable columns for safe production migrations.

**Frontend**: Single-page app with tab navigation. Uses fetch() for API calls, Chart.js for visualizations (Gantt charts, capacity trends), and a multi-select filter component system.

## Key Patterns

**API Design**: RESTful endpoints at `/api/<resource>`. Snake_case in Python/database, camelCase in JSON responses. All models implement `.to_dict()` for serialization.

**Authentication**: Session-based with LDAP/AD integration. Fallback `admin/admin` for local dev. Admin users hardcoded in app.py: `['twilcox', 'csmoak', 'tthompson', 'epeschel', 'myumang', 'admin']`. Use `@admin_required` and `@login_required` decorators.

**Database Schema Changes**: All new columns must be nullable. For local dev, delete `instance/operations.db` and restart. For production, use migration scripts that add columns safely.

## Development Workflow

1. Flask auto-reloads on code changes
2. Hard refresh browser (`Ctrl+F5`) if CSS/JS changes don't appear
3. **Version string in `templates/index.html`** must be updated before each push (search for `v1.` in hamburger menu div)
4. Production deployment requires notifying Tom Wilcox (twilcox@proterra.com) to pull changes and run `sudo systemctl restart operationsdash`

## Database Protection

The server database is the source of truth. Never push local database changes. Run this after cloning:
```bash
git update-index --assume-unchanged instance/operations.db
```

## Integrations

- **Jira**: Requires `JIRA_API_TOKEN`, `JIRA_BASE_URL`, `JIRA_EMAIL` in `.env`
- **Ignition MES**: Air-gapped manufacturing system (optional, uses self-signed certs)
- **LDAP/AD**: Production authentication
