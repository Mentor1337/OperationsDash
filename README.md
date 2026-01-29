# Operations Dashboard

A Flask-based operations management dashboard for tracking projects, resources, milestones, and team capacity.

## Features

- **Project Management**: Track projects with tasks, budgets, and timelines
- **Resource Planning**: Monitor engineer capacity and allocation
- **Roadmap Visualization**: Gantt chart view of project timelines
- **Milestone Tracking**: Track and visualize project milestones
- **Jira Integration**: Sync tasks and data with Jira
- **Ignition MES Integration**: Connect to air-gapped manufacturing systems

## Setup

### Prerequisites

- Python 3.8+
- pip

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd OperationsDash
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   
   Copy the example environment file and fill in your values:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   - `JIRA_API_TOKEN`: Your Jira API token
   - `JIRA_EMAIL`: Your Jira email address
   - `SECRET_KEY`: A random secret key (generate with `python -c "import secrets; print(secrets.token_hex(32))"`)
   - Other optional configurations for Ignition MES and Power Automate

4. **Initialize the database**
   ```bash
   python app.py
   ```
   The database will be created automatically on first run.

5. **Access the application**
   
   Open your browser to `http://localhost:5000`

## Environment Variables

All sensitive configuration is stored in `.env` (not committed to git). See `.env.example` for a template.

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | Flask secret key for sessions | Yes |
| `DATABASE_URI` | Database connection string | No (defaults to SQLite) |
| `JIRA_API_TOKEN` | Jira API authentication token | For Jira features |
| `JIRA_BASE_URL` | Your Jira instance URL | For Jira features |
| `JIRA_EMAIL` | Your Jira email | For Jira features |
| `IGNITION_API_BASE_URL` | Ignition MES API endpoint | For MES features |
| `IGNITION_API_USERNAME` | Ignition API username | Optional |
| `IGNITION_API_PASSWORD` | Ignition API password | Optional |

## Project Structure

```
OperationsDash/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (not in git)
├── .env.example          # Environment template
├── .gitignore            # Git ignore rules
├── instance/
│   └── operations.db     # SQLite database (not in git)
├── static/
│   ├── css/
│   │   └── style.css     # Application styles
│   └── js/
│       └── app.js        # Frontend JavaScript
└── templates/
    └── index.html        # Main HTML template
```

## Usage

### Managing Projects

1. Navigate to the **Projects** tab
2. Click **Add Project** to create a new project
3. Add tasks, set budgets, and assign engineers
4. Track progress with the status indicators

### Resource Planning

1. Go to the **Resources** tab
2. Add engineers with **Add Engineer**
3. Set non-project time (meetings, support, etc.)
4. View capacity charts and utilization trends
5. Use the year filter to forecast future capacity

### Roadmap & Milestones

- **Roadmap**: View project timelines in a Gantt chart
- **Milestones**: Track and visualize project milestones
- Use date filters to focus on specific time periods

## Development

### Running in Development Mode

```bash
# Set environment variable
export FLASK_ENV=development  # Linux/Mac
set FLASK_ENV=development     # Windows

# Run the app
python app.py
```

### Database Schema

The app uses SQLAlchemy ORM with the following models:
- `Engineer`: Team members and their capacity
- `Project`: Projects with budgets and timelines
- `Task`: Project tasks assigned to engineers
- `Milestone`: Project milestones
- `Expense`: Project expenses
- `NonProjectTime`: Engineer non-project allocations
- `JiraConfig`: Jira integration settings

## Security Notes

⚠️ **Important Security Practices**:

1. Never commit `.env` to version control
2. Rotate API tokens regularly (check `JIRA_API_EXPIRY`)
3. Use strong, random `SECRET_KEY` values
4. Keep `requirements.txt` dependencies updated
5. Review `.gitignore` to ensure no secrets are committed

## License

Internal Proterra Tool

## Support

For issues or questions, contact the development team.
