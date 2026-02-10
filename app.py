

from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, date
from dotenv import load_dotenv
import requests
import os
import urllib3

# Load environment variables from .env file
load_dotenv()

# Disable annoying SSL warnings 
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)
CORS(app)

# Configuration from environment variables
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI', 'sqlite:///operations.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', os.urandom(24))

# Power Automate endpoint (one day....)
POWER_AUTOMATE_URL = os.getenv('POWER_AUTOMATE_URL', '')

# Jira Configuration
JIRA_API_TOKEN = os.getenv('JIRA_API_TOKEN', '')
JIRA_BASE_URL = os.getenv('JIRA_BASE_URL', 'https://projectcolibri.atlassian.net')
JIRA_API_EXPIRY = os.getenv('JIRA_API_EXPIRY', '2027-01-20')
JIRA_EMAIL = os.getenv('JIRA_EMAIL', 'twilcox@proterra.com')

# Ignition API Configuration (air-gapped environment)
IGNITION_API_BASE_URL = os.getenv(
    'IGNITION_API_BASE_URL', 
    'https://ignitionmes1.mes-greer.proterra.com:8043/system/webdev/HexMES/api/v1'
)
IGNITION_API_USERNAME = os.getenv('IGNITION_API_USERNAME', '')
IGNITION_API_PASSWORD = os.getenv('IGNITION_API_PASSWORD', '')

db = SQLAlchemy(app)

# ============================================================================
# Database Models
# ============================================================================

class Engineer(db.Model):
    __tablename__ = 'engineers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    role = db.Column(db.String(100))
    total_hours = db.Column(db.Integer, default=40)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    non_project_time = db.relationship('EngineerNonProjectTime', backref='engineer', 
                                        cascade='all, delete-orphan', lazy=True)
    tasks = db.relationship('Task', backref='engineer', cascade='all, delete-orphan', lazy=True)
    owned_projects = db.relationship('Project', backref='owner', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'role': self.role,
            'totalHours': self.total_hours,
            'nonProjectTime': [npt.to_dict() for npt in self.non_project_time]
        }


class EngineerNonProjectTime(db.Model):
    __tablename__ = 'engineer_non_project_time'
    id = db.Column(db.Integer, primary_key=True)
    engineer_id = db.Column(db.Integer, db.ForeignKey('engineers.id'), nullable=False)
    type = db.Column(db.String(100), nullable=False)
    hours = db.Column(db.Integer, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'hours': self.hours
        }


class ProjectYearlyBudget(db.Model):
    __tablename__ = 'project_yearly_budgets'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    amount = db.Column(db.Float, nullable=False, default=0)

    __table_args__ = (db.UniqueConstraint('project_id', 'year'),)

    def to_dict(self):
        return {
            'id': self.id,
            'year': self.year,
            'amount': self.amount
        }


class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('engineers.id'))
    priority = db.Column(db.String(20), default='Medium')
    status = db.Column(db.String(20), default='Planned')
    progress = db.Column(db.Integer, default=0)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    estimated_hours_per_week = db.Column(db.Integer, default=0)
    budget = db.Column(db.Float, default=0)
    spent = db.Column(db.Float, default=0)
    notes = db.Column(db.Text)
    location = db.Column(db.String(50))  # Module Line, Pack Line, or Live Agnostic
    jira_key = db.Column(db.String(50))  # Jira project/issue key (e.g., PROJ-123)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    expenses = db.relationship('Expense', backref='project', cascade='all, delete-orphan', lazy=True)
    milestones = db.relationship('Milestone', backref='project', cascade='all, delete-orphan', lazy=True)
    tasks = db.relationship('Task', backref='project', cascade='all, delete-orphan', lazy=True)
    change_history = db.relationship('ChangeHistory', backref='project', cascade='all, delete-orphan', lazy=True)
    jira_issues = db.relationship('ProjectJiraIssue', backref='project', cascade='all, delete-orphan', lazy=True)
    yearly_budgets = db.relationship('ProjectYearlyBudget', backref='project', cascade='all, delete-orphan', lazy=True)
    
    def to_dict(self):
        owner_name = self.owner.name if self.owner else 'Unassigned'
        return {
            'id': self.id,
            'name': self.name,
            'owner': owner_name,
            'ownerId': self.owner_id,
            'priority': self.priority,
            'status': self.status,
            'progress': self.progress,
            'startDate': self.start_date.isoformat() if self.start_date else None,
            'endDate': self.end_date.isoformat() if self.end_date else None,
            'estimatedHoursPerWeek': self.estimated_hours_per_week,
            'budget': self.budget,
            'spent': self.spent,
            'notes': self.notes,
            'location': self.location,
            'jiraKey': self.jira_key,  # Kept for backward compatibility
            'jiraKeys': [ji.jira_key for ji in self.jira_issues],  # New array of Jira keys
            'expenses': [e.to_dict() for e in self.expenses],
            'milestones': [m.to_dict() for m in self.milestones],
            'tasks': [t.to_dict() for t in self.tasks],
            'changeHistory': [ch.to_dict() for ch in self.change_history],
            'yearlyBudgets': [yb.to_dict() for yb in self.yearly_budgets]
        }


class Expense(db.Model):
    __tablename__ = 'expenses'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(500), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'description': self.description,
            'amount': self.amount,
            'category': self.category
        }


class Milestone(db.Model):
    __tablename__ = 'milestones'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    planned_date = db.Column(db.Date, nullable=False)
    actual_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='pending')
    # Optional fields for capacity planning
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    hours_per_week = db.Column(db.Integer)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'plannedDate': self.planned_date.isoformat() if self.planned_date else None,
            'actualDate': self.actual_date.isoformat() if self.actual_date else None,
            'status': self.status,
            'startDate': self.start_date.isoformat() if self.start_date else None,
            'endDate': self.end_date.isoformat() if self.end_date else None,
            'hoursPerWeek': self.hours_per_week,
            'assignments': [a.to_dict() for a in self.assignments]
        }


class MilestoneAssignment(db.Model):
    __tablename__ = 'milestone_assignments'
    id = db.Column(db.Integer, primary_key=True)
    milestone_id = db.Column(db.Integer, db.ForeignKey('milestones.id'), nullable=False)
    engineer_id = db.Column(db.Integer, db.ForeignKey('engineers.id'), nullable=False)
    hours_per_week = db.Column(db.Integer, nullable=False)

    __table_args__ = (db.UniqueConstraint('milestone_id', 'engineer_id'),)

    # Relationships
    milestone = db.relationship('Milestone', backref=db.backref('assignments', cascade='all, delete-orphan', lazy=True))
    engineer = db.relationship('Engineer', backref=db.backref('milestone_assignments', cascade='all, delete-orphan', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'milestoneId': self.milestone_id,
            'engineerId': self.engineer_id,
            'engineer': self.engineer.name if self.engineer else None,
            'hoursPerWeek': self.hours_per_week
        }


class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    engineer_id = db.Column(db.Integer, db.ForeignKey('engineers.id'), nullable=False)
    hours_per_week = db.Column(db.Integer, nullable=False)
    
    __table_args__ = (db.UniqueConstraint('project_id', 'engineer_id'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'engineer': self.engineer.name if self.engineer else None,
            'engineerId': self.engineer_id,
            'hoursPerWeek': self.hours_per_week
        }



class ChangeHistory(db.Model):
    __tablename__ = 'change_history'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    field = db.Column(db.String(100), nullable=False)
    old_value = db.Column(db.String(500))
    new_value = db.Column(db.String(500))
    changed_at = db.Column(db.DateTime, default=datetime.utcnow)
    changed_by = db.Column(db.String(100))
    
    def to_dict(self):
        return {
            'id': self.id,
            'field': self.field,
            'oldValue': self.old_value,
            'newValue': self.new_value,
            'changedAt': self.changed_at.isoformat() if self.changed_at else None,
            'changedBy': self.changed_by
        }


class ProjectJiraIssue(db.Model):
    """Junction table for many-to-many relationship between Projects and Jira issues"""
    __tablename__ = 'project_jira_issues'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    jira_key = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Ensure no duplicate jira keys per project
    __table_args__ = (db.UniqueConstraint('project_id', 'jira_key', name='uq_project_jira_key'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'projectId': self.project_id,
            'jiraKey': self.jira_key,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }


# ============================================================================
# Routes - Main Page
# ============================================================================

@app.route('/')
def index():
    return render_template('index.html')


# ============================================================================
# API Routes - Engineers
# ============================================================================

@app.route('/api/engineers', methods=['GET'])
def get_engineers():
    engineers = Engineer.query.all()
    return jsonify([e.to_dict() for e in engineers])


@app.route('/api/engineers/<int:id>', methods=['GET'])
def get_engineer(id):
    engineer = Engineer.query.get_or_404(id)
    return jsonify(engineer.to_dict())


@app.route('/api/engineers', methods=['POST'])
def create_engineer():
    data = request.get_json()
    engineer = Engineer(
        name=data['name'],
        role=data.get('role', ''),
        total_hours=data.get('totalHours', 40)
    )
    db.session.add(engineer)
    db.session.commit()
    return jsonify(engineer.to_dict()), 201


@app.route('/api/engineers/<int:id>', methods=['PUT'])
def update_engineer(id):
    engineer = Engineer.query.get_or_404(id)
    data = request.get_json()
    
    if 'name' in data:
        engineer.name = data['name']
    if 'role' in data:
        engineer.role = data['role']
    if 'totalHours' in data:
        engineer.total_hours = data['totalHours']
    
    db.session.commit()
    return jsonify(engineer.to_dict())


@app.route('/api/engineers/<int:id>', methods=['DELETE'])
def delete_engineer(id):
    engineer = Engineer.query.get_or_404(id)

    # Clear ownership from any projects this engineer owns
    for project in engineer.owned_projects:
        project.owner_id = None

    db.session.delete(engineer)
    db.session.commit()
    return '', 204


# Non-Project Time endpoints
@app.route('/api/engineers/<int:id>/non-project-time', methods=['POST'])
def add_non_project_time(id):
    engineer = Engineer.query.get_or_404(id)
    data = request.get_json()
    
    npt = EngineerNonProjectTime(
        engineer_id=id,
        type=data['type'],
        hours=data['hours']
    )
    db.session.add(npt)
    db.session.commit()
    return jsonify(npt.to_dict()), 201


@app.route('/api/engineers/<int:eng_id>/non-project-time/<int:npt_id>', methods=['PUT'])
def update_non_project_time(eng_id, npt_id):
    npt = EngineerNonProjectTime.query.get_or_404(npt_id)
    data = request.get_json()
    
    if 'type' in data:
        npt.type = data['type']
    if 'hours' in data:
        npt.hours = data['hours']
    
    db.session.commit()
    return jsonify(npt.to_dict())


@app.route('/api/engineers/<int:eng_id>/non-project-time/<int:npt_id>', methods=['DELETE'])
def delete_non_project_time(eng_id, npt_id):
    npt = EngineerNonProjectTime.query.get_or_404(npt_id)
    db.session.delete(npt)
    db.session.commit()
    return '', 204


# ============================================================================
# API Routes - Projects
# ============================================================================

@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = Project.query.all()
    return jsonify([p.to_dict() for p in projects])


@app.route('/api/projects/<int:id>', methods=['GET'])
def get_project(id):
    project = Project.query.get_or_404(id)
    return jsonify(project.to_dict())


@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.get_json()
    
    # Find owner by name or id
    owner_id = data.get('ownerId')
    if not owner_id and 'owner' in data:
        owner = Engineer.query.filter_by(name=data['owner']).first()
        owner_id = owner.id if owner else None
    
    project = Project(
        name=data['name'],
        owner_id=owner_id,
        priority=data.get('priority', 'Medium'),
        status=data.get('status', 'Planned'),
        progress=data.get('progress', 0),
        start_date=datetime.strptime(data['startDate'], '%Y-%m-%d').date() if data.get('startDate') else None,
        end_date=datetime.strptime(data['endDate'], '%Y-%m-%d').date() if data.get('endDate') else None,
        estimated_hours_per_week=data.get('estimatedHoursPerWeek', 0),
        budget=data.get('budget', 0),
        spent=data.get('spent', 0),
        notes=data.get('notes', ''),
        location=data.get('location'),
        jira_key=data.get('jiraKey')
    )
    db.session.add(project)
    db.session.flush()  # Get the project ID

    # Add yearly budgets if provided
    if 'yearlyBudgets' in data:
        for yb in data['yearlyBudgets']:
            if yb.get('amount', 0) > 0:
                yearly_budget = ProjectYearlyBudget(
                    project_id=project.id,
                    year=yb['year'],
                    amount=yb['amount']
                )
                db.session.add(yearly_budget)

    db.session.commit()
    return jsonify(project.to_dict()), 201


@app.route('/api/projects/<int:id>', methods=['PUT'])
def update_project(id):
    project = Project.query.get_or_404(id)
    data = request.get_json()
    
    # Track changes for history
    changes = []
    
    if 'name' in data and data['name'] != project.name:
        changes.append(('Name', project.name, data['name']))
        project.name = data['name']
    
    if 'ownerId' in data:
        project.owner_id = data['ownerId']
    elif 'owner' in data:
        owner = Engineer.query.filter_by(name=data['owner']).first()
        if owner:
            project.owner_id = owner.id
    
    if 'priority' in data and data['priority'] != project.priority:
        changes.append(('Priority', project.priority, data['priority']))
        project.priority = data['priority']
    
    if 'status' in data and data['status'] != project.status:
        changes.append(('Status', project.status, data['status']))
        project.status = data['status']
    
    if 'progress' in data:
        project.progress = data['progress']
    
    if 'startDate' in data:
        old_date = project.start_date.isoformat() if project.start_date else None
        new_date = data['startDate']
        if old_date != new_date:
            changes.append(('Start Date', old_date, new_date))
        project.start_date = datetime.strptime(new_date, '%Y-%m-%d').date() if new_date else None
    
    if 'endDate' in data:
        old_date = project.end_date.isoformat() if project.end_date else None
        new_date = data['endDate']
        if old_date != new_date:
            changes.append(('End Date', old_date, new_date))
        project.end_date = datetime.strptime(new_date, '%Y-%m-%d').date() if new_date else None
    
    if 'estimatedHoursPerWeek' in data:
        project.estimated_hours_per_week = data['estimatedHoursPerWeek']
    
    if 'budget' in data:
        project.budget = data['budget']
    
    if 'spent' in data:
        project.spent = data['spent']
    
    if 'notes' in data:
        project.notes = data['notes']
    
    if 'location' in data:
        project.location = data['location']
    
    if 'jiraKey' in data:
        project.jira_key = data['jiraKey']
    
    # Handle yearly budgets
    if 'yearlyBudgets' in data:
        # Clear existing yearly budgets
        ProjectYearlyBudget.query.filter_by(project_id=project.id).delete()
        # Add new yearly budgets
        for yb in data['yearlyBudgets']:
            if yb.get('amount', 0) > 0:
                yearly_budget = ProjectYearlyBudget(
                    project_id=project.id,
                    year=yb['year'],
                    amount=yb['amount']
                )
                db.session.add(yearly_budget)

    # Record changes
    changed_by = project.owner.name if project.owner else 'System'
    for field, old_val, new_val in changes:
        ch = ChangeHistory(
            project_id=project.id,
            field=field,
            old_value=str(old_val) if old_val else '',
            new_value=str(new_val) if new_val else '',
            changed_by=changed_by
        )
        db.session.add(ch)

    db.session.commit()
    return jsonify(project.to_dict())


@app.route('/api/projects/<int:id>', methods=['DELETE'])
def delete_project(id):
    project = Project.query.get_or_404(id)
    db.session.delete(project)
    db.session.commit()
    return '', 204


# ============================================================================
# API Routes - Project Jira Issues
# ============================================================================

@app.route('/api/projects/<int:project_id>/jira', methods=['GET'])
def get_project_jira_issues(project_id):
    """Get all Jira issues for a project"""
    project = Project.query.get_or_404(project_id)
    return jsonify([ji.to_dict() for ji in project.jira_issues])


@app.route('/api/projects/<int:project_id>/jira', methods=['POST'])
def add_project_jira_issue(project_id):
    """Add a Jira issue to a project"""
    project = Project.query.get_or_404(project_id)
    data = request.get_json()
    
    jira_key = data.get('jiraKey', '').strip()
    if not jira_key:
        return jsonify({'error': 'jiraKey is required'}), 400
    
    # Check if this Jira key already exists for this project
    existing = ProjectJiraIssue.query.filter_by(
        project_id=project_id,
        jira_key=jira_key
    ).first()
    
    if existing:
        return jsonify({'error': f'Jira issue {jira_key} is already linked to this project'}), 400
    
    jira_issue = ProjectJiraIssue(
        project_id=project_id,
        jira_key=jira_key
    )
    db.session.add(jira_issue)
    db.session.commit()
    
    return jsonify(jira_issue.to_dict()), 201


@app.route('/api/projects/<int:project_id>/jira/<jira_key>', methods=['DELETE'])
def delete_project_jira_issue(project_id, jira_key):
    """Remove a Jira issue from a project"""
    jira_issue = ProjectJiraIssue.query.filter_by(
        project_id=project_id,
        jira_key=jira_key
    ).first_or_404()
    
    db.session.delete(jira_issue)
    db.session.commit()
    
    return '', 204


# ============================================================================
# API Routes - Expenses
# ============================================================================

@app.route('/api/projects/<int:project_id>/expenses', methods=['POST'])
def add_expense(project_id):
    project = Project.query.get_or_404(project_id)
    data = request.get_json()
    
    expense = Expense(
        project_id=project_id,
        date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
        description=data['description'],
        amount=data['amount'],
        category=data.get('category', 'Other')
    )
    db.session.add(expense)
    
    # Update project spent amount
    project.spent += expense.amount
    
    db.session.commit()
    return jsonify(expense.to_dict()), 201


@app.route('/api/expenses/<int:id>', methods=['PUT'])
def update_expense(id):
    expense = Expense.query.get_or_404(id)
    project = expense.project
    old_amount = expense.amount
    data = request.get_json()
    
    if 'date' in data:
        expense.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    if 'description' in data:
        expense.description = data['description']
    if 'amount' in data:
        expense.amount = data['amount']
        # Update project spent
        project.spent = project.spent - old_amount + expense.amount
    if 'category' in data:
        expense.category = data['category']
    
    db.session.commit()
    return jsonify(expense.to_dict())


@app.route('/api/expenses/<int:id>', methods=['DELETE'])
def delete_expense(id):
    expense = Expense.query.get_or_404(id)
    project = expense.project
    
    # Update project spent
    project.spent -= expense.amount
    
    db.session.delete(expense)
    db.session.commit()
    return '', 204


# ============================================================================
# API Routes - Milestones
# ============================================================================

@app.route('/api/projects/<int:project_id>/milestones', methods=['POST'])
def add_milestone(project_id):
    project = Project.query.get_or_404(project_id)
    data = request.get_json()

    milestone = Milestone(
        project_id=project_id,
        name=data['name'],
        planned_date=datetime.strptime(data['plannedDate'], '%Y-%m-%d').date(),
        actual_date=datetime.strptime(data['actualDate'], '%Y-%m-%d').date() if data.get('actualDate') else None,
        status=data.get('status', 'pending')
    )
    db.session.add(milestone)
    db.session.flush()  # Get milestone ID before recalculating

    # Auto-calculate milestone date ranges
    recalculate_milestone_dates(project_id)

    # Record change history
    changed_by = project.owner.name if project.owner else 'System'
    ch = ChangeHistory(
        project_id=project_id,
        field=f'Milestone Added',
        old_value='',
        new_value=f'{milestone.name} ({data["plannedDate"]})',
        changed_by=changed_by
    )
    db.session.add(ch)

    db.session.commit()
    return jsonify(milestone.to_dict()), 201


@app.route('/api/milestones/<int:id>', methods=['PUT'])
def update_milestone(id):
    milestone = Milestone.query.get_or_404(id)
    project = milestone.project
    data = request.get_json()

    # Track changes for history
    changes = []
    milestone_name = milestone.name  # Store original name for change tracking

    if 'name' in data and data['name'] != milestone.name:
        changes.append((f'Milestone "{milestone_name}" Name', milestone.name, data['name']))
        milestone.name = data['name']
        milestone_name = data['name']  # Update for subsequent change messages
    if 'plannedDate' in data:
        old_date = milestone.planned_date.strftime('%Y-%m-%d') if milestone.planned_date else ''
        if old_date != data['plannedDate']:
            changes.append((f'Milestone "{milestone_name}" Planned Date', old_date, data['plannedDate']))
        milestone.planned_date = datetime.strptime(data['plannedDate'], '%Y-%m-%d').date()
    if 'actualDate' in data:
        old_date = milestone.actual_date.strftime('%Y-%m-%d') if milestone.actual_date else ''
        new_date = data['actualDate'] or ''
        if old_date != new_date:
            changes.append((f'Milestone "{milestone_name}" Actual Date', old_date, new_date))
        milestone.actual_date = datetime.strptime(data['actualDate'], '%Y-%m-%d').date() if data['actualDate'] else None
    if 'status' in data and data['status'] != milestone.status:
        changes.append((f'Milestone "{milestone_name}" Status', milestone.status, data['status']))
        milestone.status = data['status']

    # Auto-calculate milestone date ranges if planned date changed
    if 'plannedDate' in data:
        recalculate_milestone_dates(milestone.project_id)

    # Record changes
    changed_by = project.owner.name if project.owner else 'System'
    for field, old_val, new_val in changes:
        ch = ChangeHistory(
            project_id=project.id,
            field=field,
            old_value=str(old_val) if old_val else '',
            new_value=str(new_val) if new_val else '',
            changed_by=changed_by
        )
        db.session.add(ch)

    db.session.commit()
    return jsonify(milestone.to_dict())


@app.route('/api/milestones/<int:id>', methods=['DELETE'])
def delete_milestone(id):
    milestone = Milestone.query.get_or_404(id)
    project = milestone.project
    project_id = milestone.project_id
    milestone_name = milestone.name
    milestone_date = milestone.planned_date.strftime('%Y-%m-%d') if milestone.planned_date else ''

    db.session.delete(milestone)

    # Recalculate dates for remaining milestones
    recalculate_milestone_dates(project_id)

    # Record change history
    changed_by = project.owner.name if project.owner else 'System'
    ch = ChangeHistory(
        project_id=project_id,
        field='Milestone Deleted',
        old_value=f'{milestone_name} ({milestone_date})',
        new_value='',
        changed_by=changed_by
    )
    db.session.add(ch)

    db.session.commit()
    return '', 204


# ============================================================================
# API Routes - Milestone Assignments
# ============================================================================

def recalculate_milestone_dates(project_id):
    """Auto-calculate start/end dates for all milestones based on planned_date ordering"""
    project = Project.query.get(project_id)
    if not project or not project.start_date:
        return

    # Get milestones sorted by planned_date
    milestones = sorted(project.milestones, key=lambda m: m.planned_date)

    if not milestones:
        return

    # First milestone: project start -> milestone 1 planned_date
    prev_date = project.start_date

    for milestone in milestones:
        milestone.start_date = prev_date
        milestone.end_date = milestone.planned_date
        prev_date = milestone.planned_date


@app.route('/api/milestones/<int:milestone_id>/assignments', methods=['GET'])
def get_milestone_assignments(milestone_id):
    """Get all engineer assignments for a milestone"""
    milestone = Milestone.query.get_or_404(milestone_id)
    return jsonify([a.to_dict() for a in milestone.assignments])


@app.route('/api/milestones/<int:milestone_id>/assignments', methods=['POST'])
def add_milestone_assignment(milestone_id):
    """Assign an engineer to a milestone"""
    milestone = Milestone.query.get_or_404(milestone_id)
    data = request.get_json()

    engineer_id = data.get('engineerId')
    if not engineer_id:
        return jsonify({'error': 'engineerId is required'}), 400

    # Check engineer exists
    engineer = Engineer.query.get(engineer_id)
    if not engineer:
        return jsonify({'error': 'Engineer not found'}), 404

    # Check for existing assignment
    existing = MilestoneAssignment.query.filter_by(
        milestone_id=milestone_id,
        engineer_id=engineer_id
    ).first()
    if existing:
        return jsonify({'error': 'Engineer already assigned to this milestone'}), 400

    assignment = MilestoneAssignment(
        milestone_id=milestone_id,
        engineer_id=engineer_id,
        hours_per_week=data.get('hoursPerWeek', 0)
    )
    db.session.add(assignment)

    # Recalculate milestone dates for the project
    recalculate_milestone_dates(milestone.project_id)

    db.session.commit()
    return jsonify(assignment.to_dict()), 201


@app.route('/api/milestone-assignments/<int:id>', methods=['PUT'])
def update_milestone_assignment(id):
    """Update an existing milestone assignment"""
    assignment = MilestoneAssignment.query.get_or_404(id)
    data = request.get_json()

    if 'hoursPerWeek' in data:
        assignment.hours_per_week = data['hoursPerWeek']

    db.session.commit()
    return jsonify(assignment.to_dict())


@app.route('/api/milestone-assignments/<int:id>', methods=['DELETE'])
def delete_milestone_assignment(id):
    """Remove an engineer assignment from a milestone"""
    assignment = MilestoneAssignment.query.get_or_404(id)
    db.session.delete(assignment)
    db.session.commit()
    return '', 204


# ============================================================================
# API Routes - Tasks (Engineer Assignments)
# ============================================================================

@app.route('/api/projects/<int:project_id>/tasks', methods=['POST'])
def add_task(project_id):
    Project.query.get_or_404(project_id)
    data = request.get_json()
    
    # Find engineer by name or id
    engineer_id = data.get('engineerId')
    if not engineer_id and 'engineer' in data:
        engineer = Engineer.query.filter_by(name=data['engineer']).first()
        engineer_id = engineer.id if engineer else None
    
    if not engineer_id:
        return jsonify({'error': 'Engineer not found'}), 400
    
    # Check if assignment already exists
    existing = Task.query.filter_by(project_id=project_id, engineer_id=engineer_id).first()
    if existing:
        return jsonify({'error': 'Engineer already assigned to this project'}), 400
    
    task = Task(
        project_id=project_id,
        engineer_id=engineer_id,
        hours_per_week=data['hoursPerWeek']
    )
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201


@app.route('/api/tasks/<int:id>', methods=['PUT'])
def update_task(id):
    task = Task.query.get_or_404(id)
    data = request.get_json()
    
    if 'hoursPerWeek' in data:
        task.hours_per_week = data['hoursPerWeek']
    
    db.session.commit()
    return jsonify(task.to_dict())


@app.route('/api/tasks/<int:id>', methods=['DELETE'])
def delete_task(id):
    task = Task.query.get_or_404(id)
    db.session.delete(task)
    db.session.commit()
    return '', 204


# ============================================================================
# API Routes - Power Automate Webhook
# ============================================================================

@app.route('/api/webhook/powerautomate', methods=['POST'])
def send_to_power_automate():
    """Send data to Power Automate endpoint"""
    if not POWER_AUTOMATE_URL:
        return jsonify({'error': 'Power Automate URL not configured', 
                       'hint': 'Set POWER_AUTOMATE_URL environment variable'}), 400
    
    data = request.get_json()
    
    try:
        response = requests.post(POWER_AUTOMATE_URL, json=data, timeout=30)
        return jsonify({
            'success': True,
            'status_code': response.status_code,
            'response': response.text
        })
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/webhook/test', methods=['POST'])
def test_webhook():
    """Test endpoint to simulate Power Automate webhook - returns what it receives"""
    data = request.get_json()
    return jsonify({
        'received': data,
        'timestamp': datetime.utcnow().isoformat(),
        'message': 'Webhook test successful'
    })


# ============================================================================
# API Routes - Jira Integration
# ============================================================================

@app.route('/api/jira/config', methods=['GET'])
def get_jira_config():
    """Get Jira configuration including API expiry warning"""
    expiry_date = datetime.strptime(JIRA_API_EXPIRY, '%Y-%m-%d').date()
    today = date.today()
    days_until_expiry = (expiry_date - today).days
    
    return jsonify({
        'baseUrl': JIRA_BASE_URL,
        'expiryDate': JIRA_API_EXPIRY,
        'daysUntilExpiry': days_until_expiry,
        'isExpired': days_until_expiry < 0,
        'showWarning': days_until_expiry <= 30  # Show warning 30 days before expiry
    })


@app.route('/api/jira/issue/<issue_key>', methods=['GET'])
def get_jira_issue(issue_key):
    """Fetch Jira issue details and its subtasks/children"""
    if not JIRA_EMAIL:
        return jsonify({'error': 'JIRA_EMAIL environment variable not set'}), 400
    
    try:
        # Fetch the main issue
        auth = (JIRA_EMAIL, JIRA_API_TOKEN)
        headers = {'Accept': 'application/json'}
        
        issue_url = f'{JIRA_BASE_URL}/rest/api/3/issue/{issue_key}'
        response = requests.get(issue_url, auth=auth, headers=headers, timeout=15, verify=False)
        
        if response.status_code == 404:
            return jsonify({'error': f'Issue {issue_key} not found'}), 404
        elif response.status_code != 200:
            return jsonify({'error': f'Jira API error: {response.status_code}'}), response.status_code
        
        issue_data = response.json()
        
        # Extract relevant fields
        issue = {
            'key': issue_data['key'],
            'summary': issue_data['fields'].get('summary', ''),
            'status': issue_data['fields'].get('status', {}).get('name', 'Unknown'),
            'statusCategory': issue_data['fields'].get('status', {}).get('statusCategory', {}).get('name', 'Unknown'),
            'issueType': issue_data['fields'].get('issuetype', {}).get('name', 'Unknown'),
            'priority': issue_data['fields'].get('priority', {}).get('name', ''),
            'assignee': issue_data['fields'].get('assignee', {}).get('displayName', 'Unassigned') if issue_data['fields'].get('assignee') else 'Unassigned',
            'url': f'{JIRA_BASE_URL}/browse/{issue_key}'
        }
        
        children = []
        
        # First try to get subtasks from the issue's subtasks field
        # Then fetch full details for each to get assignee
        subtask_refs = issue_data['fields'].get('subtasks', [])
        for subtask_ref in subtask_refs:
            subtask_key = subtask_ref['key']
            try:
                subtask_url = f'{JIRA_BASE_URL}/rest/api/3/issue/{subtask_key}'
                subtask_params = {'fields': 'summary,status,issuetype,priority,assignee'}
                subtask_response = requests.get(subtask_url, auth=auth, headers=headers, params=subtask_params, timeout=10, verify=False)
                if subtask_response.status_code == 200:
                    subtask = subtask_response.json()
                    children.append({
                        'key': subtask['key'],
                        'summary': subtask['fields'].get('summary', ''),
                        'status': subtask['fields'].get('status', {}).get('name', 'Unknown'),
                        'statusCategory': subtask['fields'].get('status', {}).get('statusCategory', {}).get('name', 'Unknown'),
                        'issueType': subtask['fields'].get('issuetype', {}).get('name', 'Subtask'),
                        'priority': subtask['fields'].get('priority', {}).get('name', '') if subtask['fields'].get('priority') else '',
                        'assignee': subtask['fields'].get('assignee', {}).get('displayName', 'Unassigned') if subtask['fields'].get('assignee') else 'Unassigned',
                        'url': f'{JIRA_BASE_URL}/browse/{subtask["key"]}'
                    })
            except requests.RequestException:
                # Fallback to limited data from subtask reference
                children.append({
                    'key': subtask_ref['key'],
                    'summary': subtask_ref['fields'].get('summary', ''),
                    'status': subtask_ref['fields'].get('status', {}).get('name', 'Unknown'),
                    'statusCategory': subtask_ref['fields'].get('status', {}).get('statusCategory', {}).get('name', 'Unknown'),
                    'issueType': 'Subtask',
                    'priority': '',
                    'assignee': 'Unassigned',
                    'url': f'{JIRA_BASE_URL}/browse/{subtask_ref["key"]}'
                })

        
        # Also search for Epic children or issues linked via "Parent Link" 
        try:
            jql = f'"Parent Link" = {issue_key} OR "Epic Link" = {issue_key} ORDER BY created ASC'
            search_url = f'{JIRA_BASE_URL}/rest/api/3/search'
            search_params = {
                'jql': jql,
                'fields': 'summary,status,issuetype,priority,assignee',
                'maxResults': 50
            }
            
            search_response = requests.get(search_url, auth=auth, headers=headers, params=search_params, timeout=15, verify=False)
            if search_response.status_code == 200:
                search_data = search_response.json()
                for child in search_data.get('issues', []):
                    # Avoid duplicates
                    if not any(c['key'] == child['key'] for c in children):
                        children.append({
                            'key': child['key'],
                            'summary': child['fields'].get('summary', ''),
                            'status': child['fields'].get('status', {}).get('name', 'Unknown'),
                            'statusCategory': child['fields'].get('status', {}).get('statusCategory', {}).get('name', 'Unknown'),
                            'issueType': child['fields'].get('issuetype', {}).get('name', 'Unknown'),
                            'priority': child['fields'].get('priority', {}).get('name', '') if child['fields'].get('priority') else '',
                            'assignee': child['fields'].get('assignee', {}).get('displayName', 'Unassigned') if child['fields'].get('assignee') else 'Unassigned',
                            'url': f'{JIRA_BASE_URL}/browse/{child["key"]}'
                        })
        except requests.RequestException:
            pass  # Epic children are optional, continue without them... too bad
        
        return jsonify({
            'issue': issue,
            'children': children
        })

        
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# API Routes - Ignition Proxy (for air-gapped env)
# ============================================================================

def _get_ignition_auth():
    """Get authentication tuple for Ignition API if credentials are configured"""
    if IGNITION_API_USERNAME and IGNITION_API_PASSWORD:
        return (IGNITION_API_USERNAME, IGNITION_API_PASSWORD)
    return None


@app.route('/api/ignition/ops/jira', methods=['GET'])
def proxy_ignition_ops_jira():
    """
    Proxy endpoint for Ignition Ops Jira data.
    Forwards requests to: {IGNITION_API_BASE_URL}/ops/jira
    
    Query Parameters (all optional, forwarded to Ignition):
        - status: Filter by status (e.g., 'open', 'closed', 'all')
        - priority: Filter by priority (e.g., 'high', 'medium', 'low')
        - assignee: Filter by assignee
        - project: Filter by project key
        - limit: Maximum number of results
        - offset: Pagination offset
    """
    try:
        # Build the target URL
        target_url = f'{IGNITION_API_BASE_URL}/ops/jira'
        
        # Forward query parameters
        params = dict(request.args)
        
        # Prepare request options
        request_kwargs = {
            'params': params,
            'headers': {'Accept': 'application/json'},
            'timeout': 30,
            'verify': False  # Allow SS certs
        }
        
        # Add authentication if configured
        auth = _get_ignition_auth()
        if auth:
            request_kwargs['auth'] = auth
        
        # Make the request to Ignition
        response = requests.get(target_url, **request_kwargs)
        
        # Return the response with the same status code
        return jsonify(response.json()), response.status_code
        
    except requests.exceptions.JSONDecodeError:
        # If response is not JSON, return raw text
        return jsonify({
            'error': 'Invalid JSON response from Ignition',
            'rawResponse': response.text[:500]  # Limit to first 500 chars
        }), 502
    except requests.exceptions.ConnectionError:
        return jsonify({
            'error': 'Could not connect to Ignition server',
            'url': target_url
        }), 503
    except requests.exceptions.Timeout:
        return jsonify({
            'error': 'Ignition server request timed out',
            'url': target_url
        }), 504
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ignition/ops/jira/<issue_key>', methods=['GET'])
def proxy_ignition_ops_jira_issue(issue_key):
    """
    Proxy endpoint for a specific Jira issue via Ignition.
    Forwards requests to: {IGNITION_API_BASE_URL}/ops/jira?issueKey={issue_key}
    """
    try:
        # Ignition expects issueKey as query param, not path segment
        target_url = f'{IGNITION_API_BASE_URL}/ops/jira'
        
        request_kwargs = {
            'params': {'issueKey': issue_key},
            'headers': {'Accept': 'application/json'},
            'timeout': 30,
            'verify': False
        }
        
        auth = _get_ignition_auth()
        if auth:
            request_kwargs['auth'] = auth
        
        response = requests.get(target_url, **request_kwargs)
        return jsonify(response.json()), response.status_code
        
    except requests.exceptions.JSONDecodeError:
        return jsonify({
            'error': 'Invalid JSON response from Ignition',
            'rawResponse': response.text[:500]
        }), 502
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ignition/proxy', methods=['GET', 'POST', 'PUT', 'DELETE'])
def proxy_ignition_generic():
    """
    Generic proxy endpoint for any Ignition API path.
    
    Query Parameter (required):
        - path: The API path to call (e.g., '/ops/jira')
    
    All other query parameters and body content are forwarded to Ignition.
    
    Examples:
        GET /api/ignition/proxy?path=/ops/jira
        POST /api/ignition/proxy?path=/ops/note  with JSON body
    """
    # Get the target path
    target_path = request.args.get('path', '')
    if not target_path:
        return jsonify({
            'error': 'Missing required "path" query parameter',
            'example': '/api/ignition/proxy?path=/ops/jira'
        }), 400
    
    # Ensure path starts with /
    if not target_path.startswith('/'):
        target_path = '/' + target_path
    
    # Build target URL
    target_url = f'{IGNITION_API_BASE_URL}{target_path}'
    
    # Forward query params (excluding 'path')
    params = {k: v for k, v in request.args.items() if k != 'path'}
    
    # Prepare request
    request_kwargs = {
        'params': params,
        'headers': {'Accept': 'application/json'},
        'timeout': 30,
        'verify': False
    }
    
    auth = _get_ignition_auth()
    if auth:
        request_kwargs['auth'] = auth
    
    # Forward JSON body for POST/PUT
    if request.method in ['POST', 'PUT'] and request.is_json:
        request_kwargs['json'] = request.get_json()
    
    try:
        # Make the proxied request
        response = requests.request(request.method, target_url, **request_kwargs)
        
        # Try to return JSON, fall back to text
        try:
            return jsonify(response.json()), response.status_code
        except ValueError:
            return jsonify({
                'success': response.ok,
                'statusCode': response.status_code,
                'response': response.text
            }), response.status_code
            
    except requests.exceptions.ConnectionError:
        return jsonify({
            'error': 'Could not connect to Ignition server',
            'url': target_url
        }), 503
    except requests.exceptions.Timeout:
        return jsonify({
            'error': 'Ignition server request timed out'
        }), 504
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ignition/health', methods=['GET'])
def check_ignition_health():
    """
    Health check endpoint to verify Ignition connectivity.
    Useful for debugging connection issues.
    """
    try:
        # Try to reach the Ignition API
        target_url = f'{IGNITION_API_BASE_URL}/ops/jira'
        
        request_kwargs = {
            'headers': {'Accept': 'application/json'},
            'timeout': 10,
            'verify': False
        }
        
        auth = _get_ignition_auth()
        if auth:
            request_kwargs['auth'] = auth
        
        response = requests.get(target_url, **request_kwargs)
        
        return jsonify({
            'status': 'connected' if response.ok else 'error',
            'statusCode': response.status_code,
            'ignitionUrl': IGNITION_API_BASE_URL,
            'authenticated': auth is not None,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except requests.exceptions.ConnectionError:
        return jsonify({
            'status': 'disconnected',
            'error': 'Could not connect to Ignition server',
            'ignitionUrl': IGNITION_API_BASE_URL,
            'timestamp': datetime.utcnow().isoformat()
        }), 503
    except requests.RequestException as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'ignitionUrl': IGNITION_API_BASE_URL,
            'timestamp': datetime.utcnow().isoformat()
        }), 500


# ============================================================================
# Database Initialization and Seed test data
# ============================================================================

def seed_database():
    """Seed the database with sample data from the React app"""
    
    # Check if already seeded
    if Engineer.query.first():
        print("Database already seeded.")
        return
    
    print("Seeding database with sample data...")
    
    # Create Engineers
    engineers_data = [
        {"name": "Mike Rodriguez", "role": "Senior Operations Engineer", "totalHours": 40,
         "nonProjectTime": [{"type": "Line Support", "hours": 8}, {"type": "Meetings", "hours": 3}]},
        {"name": "Sarah Chen", "role": "Process Engineer", "totalHours": 40,
         "nonProjectTime": [{"type": "Line Support", "hours": 10}, {"type": "Training", "hours": 2}]},
        {"name": "Tom Williams", "role": "Quality Engineer", "totalHours": 40,
         "nonProjectTime": [{"type": "Line Support", "hours": 15}, {"type": "Equipment Maintenance", "hours": 5}, {"type": "Meetings", "hours": 2}]},
        {"name": "Jessica Park", "role": "Manufacturing Engineer", "totalHours": 40,
         "nonProjectTime": [{"type": "Line Support", "hours": 12}, {"type": "Documentation", "hours": 3}]}
    ]
    
    engineers = {}
    for eng_data in engineers_data:
        eng = Engineer(name=eng_data["name"], role=eng_data["role"], total_hours=eng_data["totalHours"])
        db.session.add(eng)
        db.session.flush()  # Get the ID
        engineers[eng_data["name"]] = eng
        
        for npt in eng_data["nonProjectTime"]:
            npt_obj = EngineerNonProjectTime(engineer_id=eng.id, type=npt["type"], hours=npt["hours"])
            db.session.add(npt_obj)
    
    # Create Projects
    projects_data = [
        {
            "name": "Battery Stacking Automation",
            "owner": "Mike Rodriguez",
            "priority": "Critical",
            "status": "On Track",
            "progress": 65,
            "startDate": "2024-11-01",
            "endDate": "2025-06-30",
            "estimatedHoursPerWeek": 20,
            "budget": 125000,
            "spent": 81250,
            "notes": "Procurement phase complete. Installation begins next month.",
            "expenses": [
                {"date": "2024-11-15", "description": "Equipment procurement", "amount": 75000, "category": "Equipment"},
                {"date": "2024-12-01", "description": "Installation contractor deposit", "amount": 6250, "category": "Labor"}
            ],
            "tasks": [
                {"engineer": "Mike Rodriguez", "hoursPerWeek": 15},
                {"engineer": "Sarah Chen", "hoursPerWeek": 10}
            ],
            "milestones": [
                {"name": "Equipment Procurement", "plannedDate": "2024-12-15", "actualDate": "2024-12-10", "status": "completed"},
                {"name": "Installation Complete", "plannedDate": "2025-03-01", "actualDate": None, "status": "pending"},
                {"name": "System Testing", "plannedDate": "2025-05-15", "actualDate": None, "status": "pending"}
            ]
        },
        {
            "name": "FAT Protocol Development",
            "owner": "Sarah Chen",
            "priority": "High",
            "status": "At Risk",
            "progress": 45,
            "startDate": "2024-10-15",
            "endDate": "2025-04-30",
            "estimatedHoursPerWeek": 25,
            "budget": 45000,
            "spent": 28500,
            "notes": "Resource constraints delaying completion. Need additional test equipment.",
            "expenses": [
                {"date": "2024-10-20", "description": "Test equipment", "amount": 18500, "category": "Equipment"},
                {"date": "2024-11-10", "description": "Consultant fees", "amount": 10000, "category": "Services"}
            ],
            "tasks": [
                {"engineer": "Sarah Chen", "hoursPerWeek": 20},
                {"engineer": "Tom Williams", "hoursPerWeek": 5}
            ],
            "milestones": [
                {"name": "Protocol Draft", "plannedDate": "2024-11-30", "actualDate": "2024-12-05", "status": "completed"},
                {"name": "Validation Testing", "plannedDate": "2025-02-15", "actualDate": None, "status": "at-risk"},
                {"name": "Final Approval", "plannedDate": "2025-04-30", "actualDate": None, "status": "pending"}
            ]
        },
        {
            "name": "Volume Ramp Preparation",
            "owner": "Mike Rodriguez",
            "priority": "Critical",
            "status": "Planned",
            "progress": 0,
            "startDate": "2026-03-01",
            "endDate": "2026-12-31",
            "estimatedHoursPerWeek": 30,
            "budget": 500000,
            "spent": 0,
            "notes": "2027 volume increase preparation. Equipment and process validation.",
            "expenses": [],
            "tasks": [
                {"engineer": "Mike Rodriguez", "hoursPerWeek": 15},
                {"engineer": "Jessica Park", "hoursPerWeek": 15}
            ],
            "milestones": [
                {"name": "Capacity Analysis", "plannedDate": "2026-04-15", "actualDate": None, "status": "pending"},
                {"name": "Equipment Orders", "plannedDate": "2026-06-30", "actualDate": None, "status": "pending"},
                {"name": "Line Validation", "plannedDate": "2026-10-31", "actualDate": None, "status": "pending"}
            ]
        },
        {
            "name": "Quality System Upgrade",
            "owner": "Tom Williams",
            "priority": "Medium",
            "status": "Behind",
            "progress": 30,
            "startDate": "2024-09-01",
            "endDate": "2025-03-31",
            "estimatedHoursPerWeek": 15,
            "budget": 85000,
            "spent": 52000,
            "notes": "Software integration issues. Vendor support required.",
            "expenses": [
                {"date": "2024-09-15", "description": "Software license", "amount": 35000, "category": "Software"},
                {"date": "2024-10-01", "description": "Vendor implementation", "amount": 17000, "category": "Services"}
            ],
            "tasks": [
                {"engineer": "Tom Williams", "hoursPerWeek": 10},
                {"engineer": "Jessica Park", "hoursPerWeek": 5}
            ],
            "milestones": [
                {"name": "Software Selection", "plannedDate": "2024-10-15", "actualDate": "2024-11-01", "status": "completed"},
                {"name": "Data Migration", "plannedDate": "2025-01-15", "actualDate": None, "status": "at-risk"},
                {"name": "Go-Live", "plannedDate": "2025-03-31", "actualDate": None, "status": "pending"}
            ]
        }
    ]
    
    for proj_data in projects_data:
        owner = engineers.get(proj_data["owner"])
        proj = Project(
            name=proj_data["name"],
            owner_id=owner.id if owner else None,
            priority=proj_data["priority"],
            status=proj_data["status"],
            progress=proj_data["progress"],
            start_date=datetime.strptime(proj_data["startDate"], '%Y-%m-%d').date(),
            end_date=datetime.strptime(proj_data["endDate"], '%Y-%m-%d').date(),
            estimated_hours_per_week=proj_data["estimatedHoursPerWeek"],
            budget=proj_data["budget"],
            spent=proj_data["spent"],
            notes=proj_data["notes"]
        )
        db.session.add(proj)
        db.session.flush()
        
        # Add expenses
        for exp_data in proj_data["expenses"]:
            exp = Expense(
                project_id=proj.id,
                date=datetime.strptime(exp_data["date"], '%Y-%m-%d').date(),
                description=exp_data["description"],
                amount=exp_data["amount"],
                category=exp_data["category"]
            )
            db.session.add(exp)
        
        # Add tasks
        for task_data in proj_data["tasks"]:
            eng = engineers.get(task_data["engineer"])
            if eng:
                task = Task(
                    project_id=proj.id,
                    engineer_id=eng.id,
                    hours_per_week=task_data["hoursPerWeek"]
                )
                db.session.add(task)
        
        # Add milestones
        for ms_data in proj_data["milestones"]:
            ms = Milestone(
                project_id=proj.id,
                name=ms_data["name"],
                planned_date=datetime.strptime(ms_data["plannedDate"], '%Y-%m-%d').date(),
                actual_date=datetime.strptime(ms_data["actualDate"], '%Y-%m-%d').date() if ms_data["actualDate"] else None,
                status=ms_data["status"]
            )
            db.session.add(ms)
    
    db.session.commit()
    print("Database seeded successfully!")


# ============================================================================
# Application Entry Point
# ============================================================================


# ============================================================================
# Database Migration - Jira Keys
# ============================================================================

def migrate_jira_keys():
    """
    Migrate existing jira_key values from projects table to project_jira_issues table.
    This is a safe one-time migration that preserves all existing data.
    """
    print("Checking for Jira key migration...")
    
    # Get all projects with jira_key set
    projects_with_keys = Project.query.filter(Project.jira_key.isnot(None), Project.jira_key != '').all()
    
    migrated_count = 0
    skipped_count = 0
    
    for project in projects_with_keys:
        # Check if this key is already in the junction table
        existing = ProjectJiraIssue.query.filter_by(
            project_id=project.id,
            jira_key=project.jira_key
        ).first()
        
        if not existing:
            # Migrate the key
            jira_issue = ProjectJiraIssue(
                project_id=project.id,
                jira_key=project.jira_key
            )
            db.session.add(jira_issue)
            migrated_count += 1
        else:
            skipped_count += 1
    
    if migrated_count > 0:
        db.session.commit()
        print(f"[OK] Migrated {migrated_count} Jira key(s) to new table")
    
    if skipped_count > 0:
        print(f"[OK] Skipped {skipped_count} already-migrated key(s)")
    
    if migrated_count == 0 and skipped_count == 0:
        print("[OK] No Jira keys to migrate")


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_database()
        migrate_jira_keys()  # Run migration after database is set up
    
    print("\n" + "="*60)
    print("Operations Dashboard - Flask Application")
    print("="*60)
    print(f"Running on: http://localhost:8001")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=8001, debug=True)
