// Operations Dashboard - Frontend JavaScript
// API Base URL
const API = '';

// State
let projects = [];
let engineers = [];
let currentTab = 'projects';
let currentProject = null;
let searchQuery = '';
let statusFilter = 'all';

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    checkJiraConfig();
    document.getElementById('new-expense-date').value = new Date().toISOString().split('T')[0];
});

async function loadData() {
    try {
        [projects, engineers] = await Promise.all([
            fetch(`${API}/api/projects`).then(r => r.json()),
            fetch(`${API}/api/engineers`).then(r => r.json())
        ]);
        renderCurrentTab();
        populateOwnerDropdowns();
    } catch (err) {
        showToast('Failed to load data', 'error');
        console.error(err);
    }
}

// ============================================================================
// Tab Management
// ============================================================================

function setTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
        btn.classList.add('text-gray-600');
    });
    document.getElementById(`tab-${tab}`).classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
    document.getElementById(`tab-${tab}`).classList.remove('text-gray-600');
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`content-${tab}`).classList.remove('hidden');
    
    renderCurrentTab();
}

function renderCurrentTab() {
    switch(currentTab) {
        case 'projects': renderProjects(); break;
        case 'roadmap': renderRoadmap(); break;
        case 'milestones': renderMilestones(); break;
        case 'resources': renderResources(); break;
    }
}

// ============================================================================
// Projects Tab
// ============================================================================

function renderProjects() {
    const container = document.getElementById('content-projects');
    container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-800">Active Projects</h2>
            <button onclick="openProjectModal()" class="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                <span>Add Project</span>
            </button>
        </div>
        <div class="flex items-center space-x-4 mb-4">
            <div class="flex-1 relative">
                <input type="text" id="project-search" placeholder="Search projects..." 
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value="${searchQuery}" oninput="handleSearch(this.value)">
                <svg class="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
            </div>
            <select id="status-filter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" onchange="handleStatusFilter(this.value)">
                <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
                <option value="On Track" ${statusFilter === 'On Track' ? 'selected' : ''}>On Track</option>
                <option value="At Risk" ${statusFilter === 'At Risk' ? 'selected' : ''}>At Risk</option>
                <option value="Behind" ${statusFilter === 'Behind' ? 'selected' : ''}>Behind</option>
                <option value="Planned" ${statusFilter === 'Planned' ? 'selected' : ''}>Planned</option>
                <option value="Completed" ${statusFilter === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
        </div>
        <div class="space-y-4" id="projects-list"></div>
    `;
    
    const list = document.getElementById('projects-list');
    const filtered = getFilteredProjects();
    if (filtered.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-center py-8">No projects match your filters</p>';
    } else {
        filtered.forEach(p => {
            list.innerHTML += createProjectCard(p);
        });
    }
}

function getFilteredProjects() {
    return projects.filter(p => {
        const matchesSearch = searchQuery === '' || 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
}

function handleSearch(value) {
    searchQuery = value;
    renderProjects();
}

function handleStatusFilter(value) {
    statusFilter = value;
    renderProjects();
}

function createProjectCard(p) {
    const statusClass = getStatusClass(p.status);
    const budgetPct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
    
    return `
        <div class="bg-white rounded-lg shadow-md border border-gray-200 project-card">
            <div class="p-4">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3">
                            <h3 class="text-lg font-semibold text-gray-800">${p.name}</h3>
                            <span class="px-3 py-1 rounded-full text-xs font-medium border ${statusClass}">${p.status}</span>
                            ${p.jiraKey ? `<button onclick="openJiraModal('${p.jiraKey}', '${p.name}')" class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200 hover:bg-blue-100 font-mono">${p.jiraKey}</button>` : ''}
                        </div>
                        <div class="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                            <span class="flex items-center space-x-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                <span>${p.owner}</span>
                            </span>
                            <span>${p.startDate} to ${p.endDate}</span>
                            <span class="font-medium ${getPriorityClass(p.priority)}">Priority: ${p.priority}</span>
                        </div>
                        <div class="mt-3">
                            <div class="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progress</span><span>${p.progress}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-blue-600 h-2 rounded-full" style="width: ${p.progress}%"></div>
                            </div>
                        </div>
                    </div>
                    <button onclick="openProjectModal(${p.id})" class="ml-4 p-2 text-gray-600 hover:bg-gray-100 rounded">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                </div>
            </div>
            <div class="px-4 pb-4 border-t border-gray-200 bg-gray-50 mt-2 pt-4">
                <div class="grid grid-cols-3 gap-4">
                    <div class="bg-white rounded-lg p-3 border border-gray-200">
                        <h4 class="font-medium text-gray-700 mb-2">Budget</h4>
                        <p class="text-sm">Budget: <span class="font-semibold">$${p.budget.toLocaleString()}</span></p>
                        <p class="text-sm">Spent: <span class="font-semibold">$${p.spent.toLocaleString()}</span></p>
                        <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div class="${budgetPct > 100 ? 'bg-red-600' : 'bg-green-600'} h-2 rounded-full" style="width: ${Math.min(budgetPct, 100)}%"></div>
                        </div>
                        <button onclick="openExpenseModal(${p.id})" class="mt-2 w-full px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100">Manage Expenses</button>
                    </div>
                    <div class="bg-white rounded-lg p-3 border border-gray-200">
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="font-medium text-gray-700">Team</h4>
                            <button onclick="openTaskModal(${p.id})" class="text-sm text-blue-600 hover:text-blue-700">Manage</button>
                        </div>
                        ${p.tasks.length > 0 ? p.tasks.map(t => `<div class="flex justify-between text-sm"><span>${t.engineer}</span><span class="font-medium">${t.hoursPerWeek} hrs/wk</span></div>`).join('') : '<p class="text-sm text-gray-500 italic">No assignments</p>'}
                    </div>
                    <div class="bg-white rounded-lg p-3 border border-gray-200">
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="font-medium text-gray-700">Milestones</h4>
                            <button onclick="openMilestoneModal(${p.id})" class="text-sm text-blue-600 hover:text-blue-700">Manage</button>
                        </div>
                        ${p.milestones.length > 0 ? p.milestones.slice(0, 3).map(m => `
                            <div class="flex items-center space-x-2 text-sm">
                                <span class="${m.status === 'completed' ? 'text-green-600' : m.status === 'at-risk' ? 'text-yellow-600' : 'text-gray-400'}">●</span>
                                <span>${m.name}</span>
                            </div>
                        `).join('') : '<p class="text-sm text-gray-500 italic">No milestones</p>'}
                    </div>
                </div>
                ${p.notes ? `<div class="mt-3"><h4 class="font-medium text-gray-700">Notes:</h4><p class="text-gray-600 text-sm">${p.notes}</p></div>` : ''}
            </div>
        </div>
    `;
}

function getStatusClass(status) {
    const classes = {
        'On Track': 'bg-green-100 text-green-800 border-green-300',
        'At Risk': 'bg-yellow-100 text-yellow-800 border-yellow-300',
        'Behind': 'bg-red-100 text-red-800 border-red-300',
        'Planned': 'bg-blue-100 text-blue-800 border-blue-300',
        'Completed': 'bg-purple-100 text-purple-800 border-purple-300',
        'Cancelled': 'bg-gray-100 text-gray-500 border-gray-300'
    };
    return classes[status] || 'bg-gray-100 text-gray-800 border-gray-300';
}

function getPriorityClass(priority) {
    const classes = {
        'Critical': 'text-red-600',
        'High': 'text-orange-600',
        'Medium': 'text-yellow-600',
        'Low': 'text-green-600'
    };
    return classes[priority] || 'text-gray-600';
}

// ============================================================================
// Project Modal
// ============================================================================

function openProjectModal(id = null) {
    const modal = document.getElementById('modal-project');
    const title = document.getElementById('modal-project-title');
    const deleteBtn = document.getElementById('btn-delete-project');
    
    if (id) {
        const p = projects.find(x => x.id === id);
        title.textContent = 'Edit Project';
        deleteBtn.classList.remove('hidden');
        document.getElementById('project-id').value = p.id;
        document.getElementById('project-name').value = p.name;
        document.getElementById('project-owner').value = p.ownerId || '';
        document.getElementById('project-priority').value = p.priority;
        document.getElementById('project-status').value = p.status;
        document.getElementById('project-progress').value = p.progress;
        document.getElementById('project-start-date').value = p.startDate || '';
        document.getElementById('project-end-date').value = p.endDate || '';
        document.getElementById('project-hours').value = p.estimatedHoursPerWeek;
        document.getElementById('project-budget').value = p.budget;
        document.getElementById('project-spent').value = p.spent;
        document.getElementById('project-notes').value = p.notes || '';
        document.getElementById('project-jira-key').value = p.jiraKey || '';
    } else {
        title.textContent = 'New Project';
        deleteBtn.classList.add('hidden');
        document.getElementById('form-project').reset();
        document.getElementById('project-id').value = '';
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('project-start-date').value = today;
    }
    
    modal.classList.remove('hidden');
}

async function saveProject(e) {
    e.preventDefault();
    const id = document.getElementById('project-id').value;
    const data = {
        name: document.getElementById('project-name').value,
        ownerId: parseInt(document.getElementById('project-owner').value) || null,
        priority: document.getElementById('project-priority').value,
        status: document.getElementById('project-status').value,
        progress: parseInt(document.getElementById('project-progress').value) || 0,
        startDate: document.getElementById('project-start-date').value,
        endDate: document.getElementById('project-end-date').value,
        estimatedHoursPerWeek: parseInt(document.getElementById('project-hours').value) || 0,
        budget: parseFloat(document.getElementById('project-budget').value) || 0,
        spent: parseFloat(document.getElementById('project-spent').value) || 0,
        notes: document.getElementById('project-notes').value,
        jiraKey: document.getElementById('project-jira-key').value || null
    };
    
    try {
        if (id) {
            await fetch(`${API}/api/projects/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        } else {
            await fetch(`${API}/api/projects`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        }
        closeModal('project');
        await loadData();
        showToast('Project saved successfully', 'success');
    } catch (err) {
        showToast('Failed to save project', 'error');
    }
}

async function deleteProject() {
    const id = document.getElementById('project-id').value;
    if (!confirm('Delete this project? This cannot be undone.')) return;
    
    try {
        await fetch(`${API}/api/projects/${id}`, { method: 'DELETE' });
        closeModal('project');
        await loadData();
        showToast('Project deleted', 'success');
    } catch (err) {
        showToast('Failed to delete project', 'error');
    }
}

// ============================================================================
// Expense Modal
// ============================================================================

function openExpenseModal(projectId) {
    const p = projects.find(x => x.id === projectId);
    currentProject = p;
    document.getElementById('expense-project-id').value = projectId;
    document.getElementById('expense-project-name').textContent = p.name;
    updateExpenseDisplay();
    document.getElementById('modal-expense').classList.remove('hidden');
}

function updateExpenseDisplay() {
    const p = currentProject;
    document.getElementById('expense-budget').textContent = `$${p.budget.toLocaleString()}`;
    document.getElementById('expense-spent').textContent = `$${p.spent.toLocaleString()}`;
    const remaining = p.budget - p.spent;
    document.getElementById('expense-remaining').textContent = `$${remaining.toLocaleString()}`;
    document.getElementById('expense-remaining').className = `text-xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`;
    const pct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
    document.getElementById('expense-percent').textContent = `${pct}%`;
    document.getElementById('expense-progress-bar').style.width = `${Math.min(pct, 100)}%`;
    document.getElementById('expense-progress-bar').className = `h-3 rounded-full transition-all duration-300 ${pct > 100 ? 'bg-red-600' : 'bg-green-600'}`;
    
    const list = document.getElementById('expenses-list');
    if (p.expenses.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-center py-6">No expenses recorded yet</p>';
    } else {
        list.innerHTML = p.expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div class="flex-1">
                    <div class="flex items-center space-x-3">
                        <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">${e.category}</span>
                        <span class="font-medium text-gray-800">${e.description}</span>
                    </div>
                    <p class="text-sm text-gray-500 mt-1">${e.date}</p>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="text-lg font-bold text-gray-800">$${e.amount.toLocaleString()}</span>
                    <button onclick="deleteExpense(${e.id})" class="p-2 text-red-600 hover:bg-red-50 rounded">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

async function addExpense() {
    const projectId = document.getElementById('expense-project-id').value;
    const data = {
        date: document.getElementById('new-expense-date').value,
        amount: parseFloat(document.getElementById('new-expense-amount').value) || 0,
        category: document.getElementById('new-expense-category').value,
        description: document.getElementById('new-expense-description').value
    };
    
    if (data.amount <= 0 || !data.description) {
        showToast('Please fill in amount and description', 'error');
        return;
    }
    
    try {
        await fetch(`${API}/api/projects/${projectId}/expenses`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        await loadData();
        currentProject = projects.find(p => p.id == projectId);
        updateExpenseDisplay();
        document.getElementById('new-expense-amount').value = '';
        document.getElementById('new-expense-description').value = '';
        showToast('Expense added', 'success');
    } catch (err) {
        showToast('Failed to add expense', 'error');
    }
}

async function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    const projectId = document.getElementById('expense-project-id').value;
    try {
        await fetch(`${API}/api/expenses/${id}`, { method: 'DELETE' });
        await loadData();
        currentProject = projects.find(p => p.id == projectId);
        updateExpenseDisplay();
        showToast('Expense deleted', 'success');
    } catch (err) {
        showToast('Failed to delete expense', 'error');
    }
}

// ============================================================================
// Milestone Modal
// ============================================================================

function openMilestoneModal(projectId) {
    const p = projects.find(x => x.id === projectId);
    currentProject = p;
    document.getElementById('milestone-project-id').value = projectId;
    document.getElementById('milestone-project-name').textContent = p.name;
    updateMilestoneDisplay();
    document.getElementById('modal-milestone').classList.remove('hidden');
}

function updateMilestoneDisplay() {
    const p = currentProject;
    const list = document.getElementById('milestones-list');
    
    if (p.milestones.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-center py-6">No milestones added yet</p>';
    } else {
        list.innerHTML = p.milestones.sort((a, b) => new Date(a.plannedDate) - new Date(b.plannedDate)).map(m => {
            const isOverdue = !m.actualDate && new Date(m.plannedDate) < new Date();
            const bgClass = m.status === 'completed' ? 'bg-green-50 border-green-200' : (m.status === 'at-risk' || isOverdue) ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200';
            const iconClass = m.status === 'completed' ? 'text-green-600' : m.status === 'at-risk' ? 'text-yellow-600' : 'text-gray-400';
            
            return `
                <div class="p-3 rounded-lg border ${bgClass}">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="flex items-center space-x-2">
                                <span class="${iconClass}">●</span>
                                <span class="font-medium text-gray-800">${m.name}</span>
                            </div>
                            <div class="mt-1 ml-4 text-sm text-gray-600">
                                Planned: ${m.plannedDate}
                                ${m.actualDate ? `<span class="ml-3">• Completed: ${m.actualDate}</span>` : ''}
                                ${isOverdue && !m.actualDate ? '<span class="ml-3 text-red-600 font-medium">• OVERDUE</span>' : ''}
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            ${m.status !== 'completed' ? `
                                <button onclick="updateMilestoneStatus(${m.id}, 'completed')" class="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200">Complete</button>
                                ${m.status !== 'at-risk' ? `<button onclick="updateMilestoneStatus(${m.id}, 'at-risk')" class="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200">At Risk</button>` : ''}
                            ` : ''}
                            <button onclick="deleteMilestone(${m.id})" class="p-2 text-red-600 hover:bg-red-50 rounded">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

async function addMilestone() {
    const projectId = document.getElementById('milestone-project-id').value;
    const status = document.getElementById('new-milestone-status').value;
    const data = {
        name: document.getElementById('new-milestone-name').value,
        plannedDate: document.getElementById('new-milestone-date').value,
        status: status,
        actualDate: status === 'completed' ? new Date().toISOString().split('T')[0] : null
    };
    
    if (!data.name || !data.plannedDate) {
        showToast('Please fill in name and date', 'error');
        return;
    }
    
    try {
        await fetch(`${API}/api/projects/${projectId}/milestones`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        await loadData();
        currentProject = projects.find(p => p.id == projectId);
        updateMilestoneDisplay();
        document.getElementById('new-milestone-name').value = '';
        document.getElementById('new-milestone-date').value = '';
        document.getElementById('new-milestone-status').value = 'pending';
        showToast('Milestone added', 'success');
    } catch (err) {
        showToast('Failed to add milestone', 'error');
    }
}

async function updateMilestoneStatus(id, status) {
    const projectId = document.getElementById('milestone-project-id').value;
    const data = { status };
    if (status === 'completed') data.actualDate = new Date().toISOString().split('T')[0];
    
    try {
        await fetch(`${API}/api/milestones/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        await loadData();
        currentProject = projects.find(p => p.id == projectId);
        updateMilestoneDisplay();
        showToast('Milestone updated', 'success');
    } catch (err) {
        showToast('Failed to update milestone', 'error');
    }
}

async function deleteMilestone(id) {
    if (!confirm('Delete this milestone?')) return;
    const projectId = document.getElementById('milestone-project-id').value;
    try {
        await fetch(`${API}/api/milestones/${id}`, { method: 'DELETE' });
        await loadData();
        currentProject = projects.find(p => p.id == projectId);
        updateMilestoneDisplay();
        showToast('Milestone deleted', 'success');
    } catch (err) {
        showToast('Failed to delete milestone', 'error');
    }
}

// ============================================================================
// Task Modal
// ============================================================================

function openTaskModal(projectId) {
    const p = projects.find(x => x.id === projectId);
    currentProject = p;
    document.getElementById('task-project-id').value = projectId;
    document.getElementById('task-project-name').textContent = p.name;
    
    const select = document.getElementById('new-task-engineer');
    select.innerHTML = engineers.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
    
    updateTaskDisplay();
    document.getElementById('modal-task').classList.remove('hidden');
}

function updateTaskDisplay() {
    const p = currentProject;
    const list = document.getElementById('tasks-list');
    const summary = document.getElementById('task-summary');
    
    if (p.tasks.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-center py-6">No team members assigned yet</p>';
        summary.classList.add('hidden');
    } else {
        list.innerHTML = p.tasks.map(t => {
            const eng = engineers.find(e => e.name === t.engineer);
            return `
                <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex-1">
                            <p class="font-medium text-gray-800">${t.engineer}</p>
                            <p class="text-xs text-gray-500">${eng?.role || ''}</p>
                        </div>
                        <div class="text-right mr-3">
                            <p class="text-lg font-bold text-gray-800">${t.hoursPerWeek} hrs/week</p>
                        </div>
                        <button onclick="deleteTask(${t.id})" class="p-2 text-red-600 hover:bg-red-50 rounded">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        const totalHours = p.tasks.reduce((sum, t) => sum + t.hoursPerWeek, 0);
        document.getElementById('task-total-hours').textContent = `${totalHours} hrs/week`;
        document.getElementById('task-member-count').textContent = p.tasks.length;
        summary.classList.remove('hidden');
    }
}

async function addTask() {
    const projectId = document.getElementById('task-project-id').value;
    const data = {
        engineerId: parseInt(document.getElementById('new-task-engineer').value),
        hoursPerWeek: parseInt(document.getElementById('new-task-hours').value) || 0
    };
    
    if (data.hoursPerWeek <= 0) {
        showToast('Please enter hours per week', 'error');
        return;
    }
    
    try {
        await fetch(`${API}/api/projects/${projectId}/tasks`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        await loadData();
        currentProject = projects.find(p => p.id == projectId);
        updateTaskDisplay();
        document.getElementById('new-task-hours').value = '';
        showToast('Assignment added', 'success');
    } catch (err) {
        showToast('Failed to add assignment (engineer may already be assigned)', 'error');
    }
}

async function deleteTask(id) {
    if (!confirm('Remove this assignment?')) return;
    const projectId = document.getElementById('task-project-id').value;
    try {
        await fetch(`${API}/api/tasks/${id}`, { method: 'DELETE' });
        await loadData();
        currentProject = projects.find(p => p.id == projectId);
        updateTaskDisplay();
        showToast('Assignment removed', 'success');
    } catch (err) {
        showToast('Failed to remove assignment', 'error');
    }
}

// ============================================================================
// Roadmap Tab
// ============================================================================

function renderRoadmap() {
    const container = document.getElementById('content-roadmap');
    container.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Project Roadmap</h2>
        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Project Timeline</h3>
            <div class="chart-container"><canvas id="gantt-chart"></canvas></div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Team Capacity Forecast</h3>
            <div class="chart-container"><canvas id="capacity-chart"></canvas></div>
        </div>
    `;
    
    renderGanttChart();
    renderCapacityChart();
}

function renderGanttChart() {
    const ctx = document.getElementById('gantt-chart');
    if (!ctx) return;
    
    const sortedProjects = [...projects].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedProjects.map(p => p.name),
            datasets: [{
                label: 'Completed',
                data: sortedProjects.map(p => p.progress),
                backgroundColor: sortedProjects.map(p => getStatusColor(p.status, 0.8)),
                borderWidth: 0
            }, {
                label: 'Remaining',
                data: sortedProjects.map(p => 100 - p.progress),
                backgroundColor: sortedProjects.map(p => getStatusColor(p.status, 0.3)),
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, max: 100, title: { display: true, text: 'Progress %' } },
                y: { stacked: true }
            },
            plugins: { legend: { display: true } }
        }
    });
}

function getStatusColor(status, alpha = 1) {
    const colors = {
        'On Track': `rgba(16, 185, 129, ${alpha})`,
        'At Risk': `rgba(245, 158, 11, ${alpha})`,
        'Behind': `rgba(239, 68, 68, ${alpha})`,
        'Planned': `rgba(59, 130, 246, ${alpha})`,
        'Completed': `rgba(139, 92, 246, ${alpha})`,
        'Cancelled': `rgba(107, 114, 128, ${alpha})`
    };
    return colors[status] || `rgba(107, 114, 128, ${alpha})`;
}

function renderCapacityChart() {
    const ctx = document.getElementById('capacity-chart');
    if (!ctx) return;
    
    const capacityData = engineers.map(eng => {
        const nonProjectTotal = eng.nonProjectTime.reduce((sum, item) => sum + item.hours, 0);
        const projectHours = projects
            .filter(p => !['Planned', 'Completed', 'Cancelled'].includes(p.status))
            .flatMap(p => p.tasks)
            .filter(t => t.engineer === eng.name)
            .reduce((sum, t) => sum + t.hoursPerWeek, 0);
        const available = eng.totalHours - nonProjectTotal - projectHours;
        return { name: eng.name, nonProject: nonProjectTotal, project: projectHours, available: Math.max(0, available) };
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: capacityData.map(d => d.name),
            datasets: [
                { label: 'Non-Project Time', data: capacityData.map(d => d.nonProject), backgroundColor: 'rgba(148, 163, 184, 0.8)' },
                { label: 'Project Work', data: capacityData.map(d => d.project), backgroundColor: 'rgba(59, 130, 246, 0.8)' },
                { label: 'Available', data: capacityData.map(d => d.available), backgroundColor: 'rgba(16, 185, 129, 0.8)' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { stacked: true }, y: { stacked: true, title: { display: true, text: 'Hours/Week' } } },
            plugins: { legend: { display: true } }
        }
    });
}

// ============================================================================
// Milestones Tab
// ============================================================================

function renderMilestones() {
    const allMilestones = projects.flatMap(p => p.milestones.map(m => ({ ...m, projectName: p.name, projectId: p.id })));
    const completed = allMilestones.filter(m => m.status === 'completed').length;
    const atRisk = allMilestones.filter(m => m.status === 'at-risk').length;
    const overdue = allMilestones.filter(m => m.status !== 'completed' && new Date(m.plannedDate) < new Date()).length;
    
    const container = document.getElementById('content-milestones');
    container.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Milestone Tracking</h2>
        <div class="grid grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow-md p-4">
                <p class="text-sm text-gray-600">Total Milestones</p>
                <p class="text-3xl font-bold text-gray-800 mt-2">${allMilestones.length}</p>
            </div>
            <div class="bg-white rounded-lg shadow-md p-4">
                <p class="text-sm text-gray-600">Completed</p>
                <p class="text-3xl font-bold text-green-600 mt-2">${completed}</p>
            </div>
            <div class="bg-white rounded-lg shadow-md p-4">
                <p class="text-sm text-gray-600">At Risk</p>
                <p class="text-3xl font-bold text-yellow-600 mt-2">${atRisk}</p>
            </div>
            <div class="bg-white rounded-lg shadow-md p-4">
                <p class="text-sm text-gray-600">Overdue</p>
                <p class="text-3xl font-bold text-red-600 mt-2">${overdue}</p>
            </div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">All Milestones</h3>
            <div class="space-y-2" id="all-milestones-list"></div>
        </div>
    `;
    
    const list = document.getElementById('all-milestones-list');
    const sorted = allMilestones.sort((a, b) => new Date(a.plannedDate) - new Date(b.plannedDate));
    
    if (sorted.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-center py-6">No milestones found</p>';
    } else {
        list.innerHTML = sorted.map(m => {
            const isOverdue = m.status !== 'completed' && new Date(m.plannedDate) < new Date();
            const bgClass = m.status === 'completed' ? 'bg-green-50 border-green-200' : (m.status === 'at-risk' || isOverdue) ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200';
            return `
                <div class="p-3 rounded-lg border ${bgClass}">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="font-medium text-gray-800">${m.name}</span>
                            <span class="text-sm text-gray-500 ml-2">- ${m.projectName}</span>
                        </div>
                        <div class="flex items-center space-x-4">
                            <span class="text-sm text-gray-600">${m.plannedDate}</span>
                            <span class="px-2 py-1 text-xs rounded ${m.status === 'completed' ? 'bg-green-100 text-green-800' : m.status === 'at-risk' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}">${m.status}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// ============================================================================
// Resources Tab
// ============================================================================

function renderResources() {
    const container = document.getElementById('content-resources');
    
    const capacityData = engineers.map(eng => {
        const nonProjectTotal = eng.nonProjectTime.reduce((sum, item) => sum + item.hours, 0);
        const projectHours = projects
            .filter(p => !['Planned', 'Completed', 'Cancelled'].includes(p.status))
            .flatMap(p => p.tasks)
            .filter(t => t.engineer === eng.name)
            .reduce((sum, t) => sum + t.hoursPerWeek, 0);
        const available = eng.totalHours - nonProjectTotal - projectHours;
        const utilization = Math.round(((eng.totalHours - available) / eng.totalHours) * 100);
        return { ...eng, nonProjectTotal, projectHours, available, utilization };
    });
    
    container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-800">Resource Management</h2>
            <button onclick="openEngineerModal()" class="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                <span>Add Engineer</span>
            </button>
        </div>
        <div class="grid grid-cols-2 gap-4">
            ${capacityData.map(eng => `
                <div class="bg-white rounded-lg shadow-md p-4">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">${eng.name}</h3>
                            <p class="text-sm text-gray-600">${eng.role || ''}</p>
                        </div>
                        <button onclick="openEngineerModal(${eng.id})" class="p-2 text-gray-600 hover:bg-gray-100 rounded">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                    </div>
                    <div class="mb-3">
                        <div class="flex justify-between text-sm mb-1">
                            <span>Utilization</span>
                            <span class="font-medium ${eng.utilization > 100 ? 'text-red-600' : eng.utilization > 85 ? 'text-yellow-600' : 'text-green-600'}">${eng.utilization}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden">
                            <div class="bg-gray-400 h-4" style="width: ${(eng.nonProjectTotal / eng.totalHours) * 100}%"></div>
                            <div class="bg-blue-600 h-4" style="width: ${(eng.projectHours / eng.totalHours) * 100}%"></div>
                            <div class="bg-green-500 h-4" style="width: ${Math.max(0, eng.available) / eng.totalHours * 100}%"></div>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Non-Project: ${eng.nonProjectTotal}h</span>
                            <span>Projects: ${eng.projectHours}h</span>
                            <span>Available: ${Math.max(0, eng.available)}h</span>
                        </div>
                    </div>
                    <div class="text-sm">
                        <p class="font-medium text-gray-700 mb-1">Non-Project Allocations:</p>
                        ${eng.nonProjectTime.map(npt => `<span class="inline-block px-2 py-1 bg-gray-100 rounded text-xs mr-1 mb-1">${npt.type}: ${npt.hours}h</span>`).join('') || '<span class="text-gray-500">None</span>'}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================================================
// Engineer Modal
// ============================================================================

let tempNonProjectTime = [];

function openEngineerModal(id = null) {
    const modal = document.getElementById('modal-engineer');
    const title = document.getElementById('modal-engineer-title');
    const deleteBtn = document.getElementById('btn-delete-engineer');
    
    if (id) {
        const eng = engineers.find(e => e.id === id);
        title.textContent = 'Edit Engineer';
        deleteBtn.classList.remove('hidden');
        document.getElementById('engineer-id').value = eng.id;
        document.getElementById('engineer-name').value = eng.name;
        document.getElementById('engineer-role').value = eng.role || '';
        document.getElementById('engineer-hours').value = eng.totalHours;
        tempNonProjectTime = [...eng.nonProjectTime];
    } else {
        title.textContent = 'New Engineer';
        deleteBtn.classList.add('hidden');
        document.getElementById('form-engineer').reset();
        document.getElementById('engineer-id').value = '';
        document.getElementById('engineer-hours').value = 40;
        tempNonProjectTime = [];
    }
    
    renderNonProjectTimeList();
    modal.classList.remove('hidden');
}

function renderNonProjectTimeList() {
    const list = document.getElementById('non-project-time-list');
    if (tempNonProjectTime.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-sm">No non-project time allocations</p>';
    } else {
        list.innerHTML = tempNonProjectTime.map((npt, idx) => `
            <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>${npt.type}: ${npt.hours}h</span>
                <button type="button" onclick="removeNonProjectTime(${idx})" class="text-red-600 hover:text-red-800">×</button>
            </div>
        `).join('');
    }
}

function addNonProjectTime() {
    const type = document.getElementById('new-npt-type').value;
    const hours = parseInt(document.getElementById('new-npt-hours').value) || 0;
    if (!type || hours <= 0) return;
    tempNonProjectTime.push({ type, hours });
    renderNonProjectTimeList();
    document.getElementById('new-npt-type').value = '';
    document.getElementById('new-npt-hours').value = '';
}

function removeNonProjectTime(idx) {
    tempNonProjectTime.splice(idx, 1);
    renderNonProjectTimeList();
}

async function saveEngineer(e) {
    e.preventDefault();
    const id = document.getElementById('engineer-id').value;
    const data = {
        name: document.getElementById('engineer-name').value,
        role: document.getElementById('engineer-role').value,
        totalHours: parseInt(document.getElementById('engineer-hours').value) || 40
    };
    
    try {
        let engId = id;
        if (id) {
            await fetch(`${API}/api/engineers/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        } else {
            const res = await fetch(`${API}/api/engineers`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
            const newEng = await res.json();
            engId = newEng.id;
        }
        
        // Handle non-project time - delete all and re-add
        const eng = engineers.find(e => e.id == engId);
        if (eng) {
            for (const npt of eng.nonProjectTime) {
                await fetch(`${API}/api/engineers/${engId}/non-project-time/${npt.id}`, { method: 'DELETE' });
            }
        }
        for (const npt of tempNonProjectTime) {
            await fetch(`${API}/api/engineers/${engId}/non-project-time`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(npt) });
        }
        
        closeModal('engineer');
        await loadData();
        showToast('Engineer saved successfully', 'success');
    } catch (err) {
        showToast('Failed to save engineer', 'error');
    }
}

async function deleteEngineer() {
    const id = document.getElementById('engineer-id').value;
    if (!confirm('Delete this engineer? This will also remove all their project assignments.')) return;
    
    try {
        await fetch(`${API}/api/engineers/${id}`, { method: 'DELETE' });
        closeModal('engineer');
        await loadData();
        showToast('Engineer deleted', 'success');
    } catch (err) {
        showToast('Failed to delete engineer', 'error');
    }
}

// ============================================================================
// Utilities
// ============================================================================

function closeModal(type) {
    document.getElementById(`modal-${type}`).classList.add('hidden');
}

function populateOwnerDropdowns() {
    const selects = [document.getElementById('project-owner')];
    selects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">-- Select Owner --</option>' + engineers.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
        }
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================================================
// Jira Integration
// ============================================================================

async function checkJiraConfig() {
    try {
        const response = await fetch(`${API}/api/jira/config`);
        const config = await response.json();
        
        const banner = document.getElementById('jira-expiry-banner');
        const message = document.getElementById('jira-expiry-message');
        
        if (config.isExpired) {
            banner.className = 'bg-red-600 text-white px-4 py-3 text-center font-medium';
            message.textContent = `⚠️ Jira API key expired on ${config.expiryDate}. Please update your API key.`;
            banner.classList.remove('hidden');
        } else if (config.showWarning) {
            banner.className = 'bg-yellow-500 text-white px-4 py-3 text-center font-medium';
            message.textContent = `⚠️ Jira API key expires in ${config.daysUntilExpiry} days (${config.expiryDate}). Please plan to renew it.`;
            banner.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Failed to check Jira config:', err);
    }
}

async function openJiraModal(issueKey, projectName) {
    const modal = document.getElementById('modal-jira');
    const mainIssue = document.getElementById('jira-main-issue');
    const childrenList = document.getElementById('jira-children-list');
    document.getElementById('jira-project-name').textContent = projectName;
    
    // Show loading state
    mainIssue.innerHTML = '<div class="flex items-center justify-center py-4"><div class="spinner"></div><span class="ml-3 text-gray-600">Loading Jira data...</span></div>';
    childrenList.innerHTML = '';
    modal.classList.remove('hidden');
    
    try {
        const response = await fetch(`${API}/api/ignition/ops/jira/${issueKey}`);
        
        if (!response.ok) {
            const error = await response.json();
            mainIssue.innerHTML = `<div class="text-center py-4"><p class="text-red-600 font-medium">Failed to load Jira data</p><p class="text-gray-600 text-sm mt-1">${error.error || 'Unknown error'}</p></div>`;
            return;
        }
        
        const data = await response.json();
        const issue = data.issue;
        
        // Render main issue
        mainIssue.innerHTML = `
            <div class="flex items-start justify-between">
                <div>
                    <div class="flex items-center space-x-2 mb-2">
                        <a href="${issue.url}" target="_blank" class="text-lg font-bold text-blue-600 hover:underline">${issue.key}</a>
                        <span class="px-2 py-1 text-xs rounded ${getJiraStatusClass(issue.statusCategory)}">${issue.status}</span>
                    </div>
                    <p class="text-gray-800 font-medium">${issue.summary}</p>
                    <div class="mt-2 text-sm text-gray-600">
                        <span class="mr-4">Type: <span class="font-medium">${issue.issueType}</span></span>
                        ${issue.priority ? `<span class="mr-4">Priority: <span class="font-medium">${issue.priority}</span></span>` : ''}
                        <span>Assignee: <span class="font-medium">${issue.assignee}</span></span>
                    </div>
                </div>
                <a href="${issue.url}" target="_blank" class="flex-shrink-0 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                    Open in Jira →
                </a>
            </div>
        `;
        
        // Render children
        if (data.children.length === 0) {
            childrenList.innerHTML = '<p class="text-gray-500 text-center py-4">No subtasks or child issues found</p>';
        } else {
            childrenList.innerHTML = data.children.map(child => `
                <a href="${child.url}" target="_blank" class="block p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <span class="font-mono text-sm text-blue-600">${child.key}</span>
                            <span class="px-2 py-0.5 text-xs rounded ${getJiraStatusClass(child.statusCategory)}">${child.status}</span>
                        </div>
                        <span class="text-xs text-gray-500">${child.issueType}</span>
                    </div>
                    <p class="text-gray-700 text-sm mt-1">${child.summary}</p>
                    <p class="text-xs text-gray-500 mt-1">Assignee: ${child.assignee}</p>
                </a>
            `).join('');
        }
        
    } catch (err) {
        mainIssue.innerHTML = `<div class="text-center py-4"><p class="text-red-600 font-medium">Failed to load Jira data</p><p class="text-gray-600 text-sm mt-1">${err.message}</p></div>`;
        console.error('Jira fetch error:', err);
    }
}

function getJiraStatusClass(statusCategory) {
    const classes = {
        'To Do': 'bg-gray-100 text-gray-700',
        'In Progress': 'bg-blue-100 text-blue-700',
        'Done': 'bg-green-100 text-green-700'
    };
    return classes[statusCategory] || 'bg-gray-100 text-gray-700';
}
