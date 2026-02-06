# Operations Dashboard - Setup Guide for Claude

This guide helps you set up the Operations Dashboard on your local PC, even if you've never worked with Python before.

## What is This?

This is a step-by-step guide that Claude will use to help you:
1. Install Python (the programming language this app uses)
2. Set up a virtual environment (isolated workspace for the app)
3. Install required packages
4. Configure the app
5. Run the app locally on your computer

## Prerequisites Check

Before starting, Claude will verify you have:
- **Windows 10/11** (this guide is Windows-specific)
- **Git** for cloning the repository
- **Administrator access** to install Python
- **Text editor** (recommend VS Code or Notepad++)

---

## Initial Setup Workflow

### IMPORTANT: First-Time Setup Detection

When a user first interacts with Claude about this project, Claude should:

1. **Check if Python is installed**:
   ```powershell
   python --version
   ```
   - If this command fails or shows Python < 3.8, guide user through Python installation

2. **Check if Git is installed**:
   ```powershell
   git --version
   ```
   - If not installed, guide user to download from https://git-scm.com/

3. **Verify the project is cloned**:
   - Check if user is in the project directory
   - If not, guide them to clone: `git clone <repo-url>`

4. **Check if virtual environment exists**:
   ```powershell
   Test-Path .\\venv
   ```
   - If False, guide user through venv creation

5. **Check if dependencies are installed**:
   - Try importing Flask in the venv
   - If fails, guide through `pip install -r requirements.txt`

6. **Check if .env file exists**:
   ```powershell
   Test-Path .\\.env
   ```
   - If False, guide user to copy `.env.example` to `.env` and fill in values

7. **Check if database exists**:
   ```powershell
   Test-Path .\\instance\\operations.db
   ```
   - If False, explain that it will be created on first run

### Only proceed to running the app after ALL checks pass!

---

## Step 1: Installing Python

### For Windows:

1. Go to https://www.python.org/downloads/
2. Download Python 3.11 or newer (click the big yellow "Download Python" button)
3. **CRITICAL**: When installing, CHECK THE BOX that says "Add Python to PATH"
4. Click "Install Now"
5. Wait for installation to complete
6. Open a new PowerShell window and verify:
   ```powershell
   python --version
   ```
   Should show: `Python 3.11.x` or higher

**If PATH wasn't added**: 
- Uninstall Python
- Reinstall and make sure to check "Add Python to PATH"

---

## Step 2: Clone the Repository

If you haven't already:

```powershell
cd C:\\Users\\<YourUsername>\\Documents
git clone https://github.com/<your-org>/OperationsDash.git
cd OperationsDash
```

---

## Step 3: Create Virtual Environment

A virtual environment keeps this project's dependencies separate from other Python projects.

```powershell
# Create virtual environment
python -m venv venv

# Activate it (YOU MUST DO THIS EVERY TIME you work on the project)
.\\venv\\Scripts\\activate

# You should see (venv) appear before your command prompt
```

**Common Issues**:
- **"cannot be loaded because running scripts is disabled"**: Run this first:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

---

## Step 4: Install Dependencies

With venv activated:

```powershell
pip install -r requirements.txt
```

This installs:
- Flask (web framework)
- SQLAlchemy (database)
- python-dotenv (environment variables)
- Other required packages

Wait for all packages to install (may take 1-2 minutes).

---

## Step 5: Configure Environment Variables

1. Copy the example environment file:
   ```powershell
   copy .env.example .env
   ```

2. Open `.env` in a text editor (Notepad, VS Code, etc.)

3. Fill in the required values:
   ```env
   # Generate a random secret key
   SECRET_KEY=<run: python -c "import secrets; print(secrets.token_hex(32))">
   
   # Add your Jira credentials (if using Jira integration)
   JIRA_API_TOKEN=your-token-here
   JIRA_EMAIL=your.email@company.com
   ```

4. Save the file

**Getting a Jira API Token**:
- Go to https://id.atlassian.com/manage-profile/security/api-tokens
- Click "Create API token"
- Give it a name like "Operations Dashboard"
- Copy the token to your `.env` file

---

## Step 6: Initialize the Database

The first time you run the app, it will create the database automatically.

```powershell
python app.py
```

You should see:
```
 * Serving Flask app 'app'
 * Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment.
 * Running on http://127.0.0.1:5000
```

**If you see errors**:
- Make sure venv is activated (see `(venv)` in prompt)
- Check that all dependencies installed correctly
- Verify `.env` file exists and has required values

---

## Step 7: Access the Dashboard

1. Open your web browser
2. Go to: http://localhost:5000
3. You should see the Operations Dashboard!

---

## Daily Workflow

Every time you want to work on the project:

1. Open PowerShell
2. Navigate to project directory:
   ```powershell
   cd C:\\Users\\<YourUsername>\\Documents\\OperationsDash
   ```
3. Activate virtual environment:
   ```powershell
   .\\venv\\Scripts\\activate
   ```
4. Run the app:
   ```powershell
   python app.py
   ```
5. Open browser to http://localhost:5000

To stop the server: Press `Ctrl+C` in PowerShell

---

## Making Changes to the Code

### Workflow:
1. Make sure the app is running (`python app.py`)
2. Edit files in your text editor
3. Save the file
4. Flask will automatically reload (you'll see it restart in PowerShell)
5. Refresh your browser to see changes

**Database Changes**:
If you modify the database models in `app.py`:
1. Stop the server (Ctrl+C)
2. Delete `instance\\operations.db` (ONLY on local dev, NEVER on server!)
3. Restart: `python app.py`
4. Database will be recreated with new schema

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'flask'"
- **Solution**: Venv not activated. Run `.\\venv\\Scripts\\activate`

### "python is not recognized"
- **Solution**: Python not in PATH. Reinstall Python with "Add to PATH" checked.

### "Port 5000 is already in use"
- **Solution**: Another process is using port 5000. Either:
  - Find and stop the other process
  - Change port in `app.py`: `app.run(debug=True, port=5001)`

### Database errors on startup
- **Solution**: Delete `instance\\operations.db` and restart app

### Changes not appearing in browser
- **Solution**: 
  - Hard refresh: `Ctrl+F5`
  - Clear browser cache
  - Check PowerShell for errors

### "Cannot activate venv"
- **Solution**: Run PowerShell as Administrator and allow scripts:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

---

## Claude Code Usage

When using Claude to help with this project:

### Typical Requests:
- "Help me add a new field to projects"
- "Fix this error I'm getting when running the app"
- "Add a new chart to the dashboard"
- "Debug why my changes aren't showing up"

### What Claude Can Do:
- Read and modify Python code
- Update HTML/JavaScript
- Help debug errors
- Add new features
- Explain how the code works

### What Claude Will Check First:
1. Is venv activated?
2. Are dependencies installed?
3. Is `.env` configured?
4. Is the database initialized?
5. Is the server running?

### Before Asking for Help - Provide:
- The error message (full text from PowerShell)
- What you were trying to do
- What file you were editing (if applicable)
- Output of `python --version` and `pip list`

---

## Project Structure

```
OperationsDash/
├── app.py                 # Main Flask application (Python backend)
├── requirements.txt       # Python dependencies
├── .env                   # Your configuration (NOT in git)
├── .env.example          # Template for .env
├── .gitignore            # What Git ignores
├── README.md             # Project documentation
├── instance/
│   └── operations.db     # SQLite database (NOT in git)
├── static/
│   ├── css/
│   │   └── style.css     # Styles
│   └── js/
│       └── app.js        # Frontend JavaScript
├── templates/
│   └── index.html        # Main HTML template
└── venv/                 # Virtual environment (NOT in git)
```

---

## Git Workflow & Database Protection

### CRITICAL: Database File Protection

> [!CAUTION]
> **NEVER PUSH DATABASE FILES TO GIT!**
> 
> The server is the **ONLY** source of truth for the database. All users pull updated databases from the server, but **USERS SHOULD NEVER PUSH DB UPDATES TO GIT**.

**Configure Git to Ignore Database Changes**:

Every time you clone or work with this repository, run this command to ensure the database file is never accidentally committed:

```powershell
git update-index --assume-unchanged instance/operations.db
```

This tells Git to ignore any local changes to the database file, even if it exists.

**What This Means**:
- Your local database changes stay local
- Only the server pushes database updates
- You pull the latest DB from the server when needed
- No risk of overwriting production data

---

## Deploying Changes to Production

> [!IMPORTANT]
> **EVERY TIME** you push updates to GitHub, you **MUST** notify Tom Wilcox to apply the updates to the server.

### Deployment Contact:
- **Name**: Tom Wilcox
- **Email**: twilcox@proterra.com
- **Phone**: 864.395.3591

### Deployment Workflow:

1. **Commit your changes**:
   ```powershell
   git add .
   git commit -m "Describe your changes"
   git push
   ```

2. **IMMEDIATELY Notify Tom Wilcox**:
   
   Send an email or call to inform that updates have been pushed:
   
   > "Hi Tom, I've just pushed updates to the Operations Dashboard GitHub repository. Please apply the changes to the server when you have a chance. Changes include: [brief description]."

3. **Wait for Confirmation**:
   - Tom will pull the changes on the server
   - He'll run any necessary migration scripts
   - He'll restart the service
   - You'll receive confirmation when deployment is complete

4. **Production Server Deployment** (Tom's steps):
   ```bash
   cd /path/to/OperationsDash
   git pull
   source venv/bin/activate  # Linux
   pip install -r requirements.txt
   # Run migration script if database schema changed
   python migrate_db.py
   sudo systemctl restart operationsdash
   ```

5. **Database Migration Safety**:
   - All new columns in this project are nullable (optional)
   - Existing data will NOT be lost
   - New columns will have NULL values for existing records
   - The `migrate_db.py` script handles schema updates safely
   - This is safe for production deployment

---

## Getting Help

### If you're stuck:
1. Check this guide first
2. Look at the Troubleshooting section
3. Ask Claude - be specific about the problem
4. Check the README.md for additional info

### Resources:
- Python Documentation: https://docs.python.org/3/
- Flask Documentation: https://flask.palletsprojects.com/
- SQLAlchemy Documentation: https://docs.sqlalchemy.org/

---

## Security Reminders

**NEVER commit these files to Git**:
- `.env` (contains secrets)
- `instance/operations.db` (contains real data)
- `venv/` (virtual environment)

These are in `.gitignore` already, but double-check before pushing!

**API Tokens**:
- Keep your Jira API token secret
- Don't share your `.env` file
- Rotate tokens regularly (check `JIRA_API_EXPIRY` in `.env`)

---

## Success Checklist

Before considering setup complete, verify:
- [ ] Python 3.8+ installed and in PATH
- [ ] Git installed
- [ ] Project cloned to local directory
- [ ] Virtual environment created
- [ ] Virtual environment can be activated
- [ ] All dependencies installed (`pip list` shows Flask, etc.)
- [ ] `.env` file exists and has required values
- [ ] Can run `python app.py` without errors
- [ ] Can access http://localhost:5000 in browser
- [ ] Can see the dashboard interface

If all boxes are checked, you're ready to develop! 🎉
