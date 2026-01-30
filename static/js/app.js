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
let ownerFilter = 'all';
let priorityFilter = 'all';
let expandedProjects = new Set();
let editingMilestoneId = null;

// Date range selectors
let ganttDateRange = String(new Date().getFullYear());
let ganttCustomStart = '';
let ganttCustomEnd = '';
let milestoneDateRange = String(new Date().getFullYear());
let milestoneCustomStart = '';
let milestoneCustomEnd = '';
let resourceDateRange = String(new Date().getFullYear());
let resourceCustomStart = '';
let resourceCustomEnd = '';
let capacityCustomStart = '';
let capacityCustomEnd = '';
let showMilestones = true;

// Chart instances for cleanup
let ganttChartInstance = null;
let capacityChartInstance = null;
let milestoneCumulativeChartInstance = null;
let capacityTrendChartInstance = null;

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
    const uniqueOwners = [...new Set(projects.map(p => p.owner).filter(Boolean))];
    const priorities = ['Critical', 'High', 'Medium', 'Low'];
    const statuses = ['On Track', 'At Risk', 'Behind', 'Planned', 'Completed', 'Cancelled'];
    const hasActiveFilters = ownerFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all';
    const filtered = getFilteredProjects();
    
    container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-800">Active Projects</h2>
            <button onclick="openProjectModal()" class="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                <span>Add Project</span>
            </button>
        </div>
        
        <!-- Filters -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
            <div class="flex items-center space-x-4 mb-4">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                <span class="font-medium text-gray-700">Filters:</span>
                ${hasActiveFilters ? `<button onclick="clearFilters()" class="text-sm text-blue-600 hover:text-blue-700">Clear Filters</button>` : ''}
                <span class="text-sm text-gray-600">Showing ${filtered.length} of ${projects.length} projects</span>
            </div>
            <div class="grid grid-cols-4 gap-4">
                <div class="flex-1 relative">
                    <input type="text" id="project-search" placeholder="Search projects..." 
                        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value="${searchQuery}" oninput="handleSearch(this.value)">
                    <svg class="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
                <div>
                    <select class="w-full px-3 py-2 border border-gray-300 rounded-lg" onchange="handleOwnerFilter(this.value)">
                        <option value="all" ${ownerFilter === 'all' ? 'selected' : ''}>All Owners</option>
                        ${uniqueOwners.map(owner => `<option value="${owner}" ${ownerFilter === owner ? 'selected' : ''}>${owner}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <select class="w-full px-3 py-2 border border-gray-300 rounded-lg" onchange="handlePriorityFilter(this.value)">
                        <option value="all" ${priorityFilter === 'all' ? 'selected' : ''}>All Priorities</option>
                        ${priorities.map(p => `<option value="${p}" ${priorityFilter === p ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <select class="w-full px-3 py-2 border border-gray-300 rounded-lg" onchange="handleStatusFilter(this.value)">
                        <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
                        ${statuses.map(s => `<option value="${s}" ${statusFilter === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
            </div>
        </div>
        
        <div class="space-y-4" id="projects-list"></div>
    `;
    
    const list = document.getElementById('projects-list');
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
        const matchesOwner = ownerFilter === 'all' || p.owner === ownerFilter;
        const matchesPriority = priorityFilter === 'all' || p.priority === priorityFilter;
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesOwner && matchesPriority && matchesStatus;
    });
}

function handleSearch(value) {
    searchQuery = value;
    renderProjects();
}

function handleOwnerFilter(value) {
    ownerFilter = value;
    renderProjects();
}

function handlePriorityFilter(value) {
    priorityFilter = value;
    renderProjects();
}

function handleStatusFilter(value) {
    statusFilter = value;
    renderProjects();
}

function clearFilters() {
    searchQuery = '';
    ownerFilter = 'all';
    priorityFilter = 'all';
    statusFilter = 'all';
    renderProjects();
}

function toggleProject(id) {
    if (expandedProjects.has(id)) {
        expandedProjects.delete(id);
    } else {
        expandedProjects.add(id);
    }
    renderProjects();
}

function createProjectCard(p) {
    const statusClass = getStatusClass(p.status);
    const budgetPct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
    const isExpanded = expandedProjects.has(p.id);
    const chevronIcon = isExpanded 
        ? `<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`
        : `<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;
    
    // Build change history HTML if available
    let changeHistoryHtml = '';
    if (p.changeHistory && p.changeHistory.length > 0) {
        const sortedChanges = [...p.changeHistory].sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
        changeHistoryHtml = `
            <div class="mt-3">
                <h4 class="font-medium text-gray-700 mb-2">Change History:</h4>
                <div class="space-y-1 max-h-32 overflow-y-auto">
                    ${sortedChanges.map(change => `
                        <div class="text-xs bg-yellow-50 border border-yellow-200 rounded p-2">
                            <div class="flex justify-between items-start">
                                <span class="font-medium text-gray-700">${change.field} changed:</span>
                                <span class="text-gray-500">${new Date(change.changedAt).toLocaleDateString()}</span>
                            </div>
                            <div class="mt-1 text-gray-600">
                                <span class="line-through">${change.oldValue}</span>
                                <span class="mx-1">→</span>
                                <span class="font-medium text-gray-800">${change.newValue}</span>
                            </div>
                            ${change.changedBy ? `<div class="text-gray-500 mt-1">by ${change.changedBy}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    return `
        <div class="bg-white rounded-lg shadow-md border border-gray-200 project-card">
            <div class="p-4 cursor-pointer hover:bg-gray-50" onclick="toggleProject(${p.id})">
                <div class="flex justify-between items-start">
                    <div class="flex items-start space-x-3 flex-1">
                        ${chevronIcon}
                        <div class="flex-1">
                            <div class="flex items-center space-x-3">
                                <h3 class="text-lg font-semibold text-gray-800">${p.name}</h3>
                                <span class="px-3 py-1 rounded-full text-xs font-medium border ${statusClass}">${p.status}</span>
                                ${p.jiraKey ? `<button onclick="event.stopPropagation(); openJiraModal('${p.jiraKey}', '${p.name}')" class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200 hover:bg-blue-100 font-mono">${p.jiraKey}</button>` : ''}
                            </div>
                            <div class="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                                <span class="flex items-center space-x-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    <span>${p.owner}</span>
                                </span>
                                <span class="flex items-center space-x-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    <span>${p.startDate} to ${p.endDate}</span>
                                </span>
                                <span class="font-medium ${getPriorityClass(p.priority)}">Priority: ${p.priority}</span>
                            </div>
                            <div class="mt-3">
                                <div class="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Progress</span><span>${p.progress}%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: ${p.progress}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onclick="event.stopPropagation(); openProjectModal(${p.id})" class="ml-4 p-2 text-gray-600 hover:bg-gray-100 rounded">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                </div>
            </div>
            ${isExpanded ? `
            <div class="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                <div class="mt-4 space-y-3">
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">Budget & Spending:</h4>
                        <div class="bg-white rounded-lg p-3 border border-gray-200">
                            <div class="flex justify-between items-center mb-2">
                                <div>
                                    <p class="text-sm text-gray-600">Budget: <span class="font-semibold text-gray-800">$${p.budget.toLocaleString()}</span></p>
                                    <p class="text-sm text-gray-600">Spent: <span class="font-semibold text-gray-800">$${p.spent.toLocaleString()}</span></p>
                                    <p class="text-sm text-gray-600">Remaining: <span class="font-semibold ${p.budget - p.spent < 0 ? 'text-red-600' : 'text-green-600'}">$${(p.budget - p.spent).toLocaleString()}</span></p>
                                </div>
                                <div class="text-right">
                                    <p class="text-2xl font-bold text-gray-800">${budgetPct}%</p>
                                    <p class="text-xs text-gray-500">of budget</p>
                                </div>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div class="${p.spent > p.budget * 1.1 ? 'bg-red-600' : p.spent > p.budget ? 'bg-yellow-500' : 'bg-green-600'} h-2 rounded-full transition-all duration-300" style="width: ${Math.min(budgetPct, 100)}%"></div>
                            </div>
                            <button onclick="event.stopPropagation(); openExpenseModal(${p.id})" class="mt-2 w-full px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100">Manage Expenses</button>
                        </div>
                    </div>
                    ${p.notes ? `
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">Latest Update:</h4>
                        <p class="text-gray-600">${p.notes}</p>
                    </div>` : ''}
                    ${changeHistoryHtml}
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="font-medium text-gray-700">Team Assignments:</h4>
                            <button onclick="event.stopPropagation(); openTaskModal(${p.id})" class="text-sm text-blue-600 hover:text-blue-700">Manage Assignments</button>
                        </div>
                        ${p.tasks.length > 0 ? `
                        <div class="space-y-1">
                            ${p.tasks.map(task => `
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">${task.engineer}</span>
                                    <span class="font-medium text-gray-800">${task.hoursPerWeek} hrs/week</span>
                                </div>
                            `).join('')}
                        </div>` : '<p class="text-sm text-gray-500 italic">No team members assigned yet</p>'}
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="font-medium text-gray-700">Milestones:</h4>
                            <button onclick="event.stopPropagation(); openMilestoneModal(${p.id})" class="text-sm text-blue-600 hover:text-blue-700">Manage Milestones</button>
                        </div>
                        ${p.milestones.length > 0 ? `
                        <div class="space-y-1">
                            ${p.milestones.map(milestone => `
                                <div class="flex items-center space-x-2 text-sm">
                                    ${milestone.status === 'completed' ? '<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' : milestone.status === 'at-risk' ? '<svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>' : '<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'}
                                    <span class="text-gray-700">${milestone.name}</span>
                                    <span class="text-gray-500">(${milestone.plannedDate})</span>
                                </div>
                            `).join('')}
                        </div>` : `
                        <button onclick="event.stopPropagation(); openMilestoneModal(${p.id})" class="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Add Milestones</button>`}
                    </div>
                </div>
            </div>` : ''}
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
            const isEditing = editingMilestoneId === m.id;
            
            if (isEditing) {
                // Editing mode - show inline form
                return `
                    <div class="p-3 rounded-lg border ${bgClass}">
                        <div class="space-y-2">
                            <input type="text" id="edit-milestone-name-${m.id}" value="${m.name}" 
                                class="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                                placeholder="Milestone name">
                            <div class="grid grid-cols-2 gap-2">
                                <input type="date" id="edit-milestone-date-${m.id}" value="${m.plannedDate}" 
                                    class="px-2 py-1 border border-gray-300 rounded text-sm">
                                <select id="edit-milestone-status-${m.id}" 
                                    class="px-2 py-1 border border-gray-300 rounded text-sm">
                                    <option value="pending" ${m.status === 'pending' ? 'selected' : ''}>Pending</option>
                                    <option value="at-risk" ${m.status === 'at-risk' ? 'selected' : ''}>At Risk</option>
                                    <option value="completed" ${m.status === 'completed' ? 'selected' : ''}>Completed</option>
                                </select>
                            </div>
                            <div class="flex space-x-2">
                                <button onclick="saveMilestoneEdit(${m.id})" 
                                    class="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                                    Save
                                </button>
                                <button onclick="cancelMilestoneEdit()" 
                                    class="flex-1 px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // View mode - show milestone with edit button
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
                                <button onclick="editMilestone(${m.id})" 
                                    class="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Edit milestone">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                                    </svg>
                                </button>
                                <button onclick="deleteMilestone(${m.id})" class="p-2 text-red-600 hover:bg-red-50 rounded">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
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
        editingMilestoneId = null;
        updateMilestoneDisplay();
        showToast('Milestone deleted', 'success');
    } catch (err) {
        showToast('Failed to delete milestone', 'error');
    }
}

function editMilestone(id) {
    editingMilestoneId = id;
    updateMilestoneDisplay();
}

function cancelMilestoneEdit() {
    editingMilestoneId = null;
    updateMilestoneDisplay();
}

async function saveMilestoneEdit(id) {
    const projectId = document.getElementById('milestone-project-id').value;
    const name = document.getElementById(`edit-milestone-name-${id}`).value;
    const plannedDate = document.getElementById(`edit-milestone-date-${id}`).value;
    const status = document.getElementById(`edit-milestone-status-${id}`).value;
    
    if (!name || !plannedDate) {
        showToast('Please fill in name and date', 'error');
        return;
    }
    
    const data = {
        name: name,
        plannedDate: plannedDate,
        status: status,
        actualDate: status === 'completed' ? new Date().toISOString().split('T')[0] : null
    };
    
    try {
        await fetch(`${API}/api/milestones/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        await loadData();
        currentProject = projects.find(p => p.id == projectId);
        editingMilestoneId = null;
        updateMilestoneDisplay();
        showToast('Milestone updated', 'success');
    } catch (err) {
        showToast('Failed to update milestone', 'error');
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
        list.innerHTML = p.tasks.map((t, idx) => {
            const eng = engineers.find(e => e.name === t.engineer);
            const capacityPct = eng ? Math.round((t.hoursPerWeek / eng.totalHours) * 100) : 0;
            return `
                <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex-1">
                            <p class="font-medium text-gray-800">${t.engineer}</p>
                            <p class="text-xs text-gray-500">${eng?.role || ''}</p>
                        </div>
                        <div class="text-right mr-3">
                            <p class="text-lg font-bold text-gray-800">${t.hoursPerWeek} hrs/week</p>
                            <p class="text-xs text-gray-500">${capacityPct}% of capacity</p>
                        </div>
                        <button onclick="deleteTask(${t.id})" class="p-2 text-red-600 hover:bg-red-50 rounded">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="number" id="edit-hours-${t.id}" value="${t.hoursPerWeek}" min="0" max="40" class="flex-1 px-3 py-1 text-sm border border-gray-300 rounded">
                        <button onclick="updateTaskHours(${t.id})" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Update</button>
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

async function updateTaskHours(taskId) {
    const projectId = document.getElementById('task-project-id').value;
    const newHours = parseInt(document.getElementById(`edit-hours-${taskId}`).value) || 0;
    
    if (newHours <= 0) {
        showToast('Hours must be greater than 0', 'error');
        return;
    }
    
    try {
        await fetch(`${API}/api/tasks/${taskId}`, { 
            method: 'PUT', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ hoursPerWeek: newHours }) 
        });
        await loadData();
        currentProject = projects.find(p => p.id == projectId);
        updateTaskDisplay();
        showToast('Hours updated', 'success');
    } catch (err) {
        showToast('Failed to update hours', 'error');
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
    const currentYear = new Date().getFullYear();
    const yearOptions = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2, currentYear + 3, currentYear + 4];
    const uniqueOwners = [...new Set(projects.map(p => p.owner).filter(Boolean))];
    const priorities = ['Critical', 'High', 'Medium', 'Low'];
    const statuses = ['On Track', 'At Risk', 'Behind', 'Planned', 'Completed', 'Cancelled'];
    const hasActiveFilters = ownerFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all';
    const filteredProjects = getFilteredProjects();
    
    container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-800">Project Roadmap</h2>
            <button onclick="openProjectModal()" class="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                <span>Add Planned Project</span>
            </button>
        </div>
        
        <!-- Filters -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
            <div class="flex items-center space-x-4 mb-4">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                <span class="font-medium text-gray-700">Filters:</span>
                ${hasActiveFilters ? `<button onclick="clearFilters(); renderRoadmap();" class="text-sm text-blue-600 hover:text-blue-700">Clear Filters</button>` : ''}
                <span class="text-sm text-gray-600">Showing ${filteredProjects.length} of ${projects.length} projects</span>
            </div>
            <div class="grid grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                    <select class="w-full px-3 py-2 border border-gray-300 rounded-lg" onchange="handleOwnerFilter(this.value); renderRoadmap();">
                        <option value="all" ${ownerFilter === 'all' ? 'selected' : ''}>All Owners</option>
                        ${uniqueOwners.map(owner => `<option value="${owner}" ${ownerFilter === owner ? 'selected' : ''}>${owner}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select class="w-full px-3 py-2 border border-gray-300 rounded-lg" onchange="handlePriorityFilter(this.value); renderRoadmap();">
                        <option value="all" ${priorityFilter === 'all' ? 'selected' : ''}>All Priorities</option>
                        ${priorities.map(p => `<option value="${p}" ${priorityFilter === p ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select class="w-full px-3 py-2 border border-gray-300 rounded-lg" onchange="handleStatusFilter(this.value); renderRoadmap();">
                        <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
                        ${statuses.map(s => `<option value="${s}" ${statusFilter === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="mt-4 flex items-center space-x-2">
                <input type="checkbox" id="showMilestonesToggle" ${showMilestones ? 'checked' : ''} onchange="showMilestones = this.checked; renderRoadmap();" class="rounded">
                <label for="showMilestonesToggle" class="text-sm font-medium text-gray-700">Show Milestones</label>
            </div>
        </div>
        
        <!-- Date Range Selector -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
            <div class="flex items-center space-x-4 mb-2">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span class="font-medium text-gray-700">Timeline:</span>
            </div>
            <div class="flex items-center space-x-2 flex-wrap gap-2">
                ${yearOptions.map(year => `
                    <button onclick="setGanttDateRange('${year}')" class="px-3 py-1 rounded ${ganttDateRange === String(year) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">${year}</button>
                `).join('')}
                <button onclick="setGanttDateRange('all')" class="px-3 py-1 rounded ${ganttDateRange === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">All Time</button>
                <button onclick="setGanttDateRange('custom')" class="px-3 py-1 rounded ${ganttDateRange === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">Custom</button>
            </div>
            ${ganttDateRange === 'custom' ? `
            <div class="mt-3 flex items-center space-x-4">
                <div>
                    <label class="block text-sm text-gray-600 mb-1">Start Date</label>
                    <input type="date" id="gantt-custom-start" value="${ganttCustomStart}" onchange="ganttCustomStart = this.value; renderRoadmap();" class="px-3 py-1 border border-gray-300 rounded">
                </div>
                <div>
                    <label class="block text-sm text-gray-600 mb-1">End Date</label>
                    <input type="date" id="gantt-custom-end" value="${ganttCustomEnd}" onchange="ganttCustomEnd = this.value; renderRoadmap();" class="px-3 py-1 border border-gray-300 rounded">
                </div>
            </div>` : ''}
        </div>
        
        <!-- Gantt Chart -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                Project Timeline - ${ganttDateRange === 'all' ? 'All Time' : ganttDateRange === 'custom' ? 'Custom Range' : ganttDateRange}
                ${hasActiveFilters ? '<span class="text-sm text-gray-500 ml-2">(Filtered)</span>' : ''}
            </h3>
            <div class="chart-container" style="height: ${Math.max(300, filteredProjects.length * 40)}px;"><canvas id="gantt-chart"></canvas></div>
        </div>
        
        <!-- Capacity Chart -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                Team Capacity Forecast
                ${hasActiveFilters ? '<span class="text-sm text-gray-500 ml-2">(Based on Filtered Projects)</span>' : ''}
            </h3>
            <div class="chart-container"><canvas id="capacity-chart"></canvas></div>
        </div>
        
        <!-- Projects & Resource Impact -->
        <div class="bg-white rounded-lg shadow-md p-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Projects & Resource Impact</h3>
            <div class="space-y-3">
                ${filteredProjects.map(project => {
                    const totalHours = project.tasks.reduce((sum, t) => sum + t.hoursPerWeek, 0);
                    const ownerTask = project.tasks.find(t => t.engineer === project.owner);
                    const ownerEng = engineers.find(e => e.name === project.owner);
                    const ownerCapacity = ownerEng?.totalHours || 40;
                    const ownerPct = ownerTask ? Math.round((ownerTask.hoursPerWeek / ownerCapacity) * 100) : 0;
                    
                    return `
                    <div class="border border-gray-200 rounded-lg p-3">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="font-medium text-gray-800">${project.name}</h4>
                                <p class="text-sm text-gray-600 mt-1">
                                    ${totalHours} hours/week total
                                    ${ownerTask ? ` • ${ownerTask.hoursPerWeek}h from ${project.owner} (${ownerPct}% of capacity)` : ''}
                                </p>
                                <p class="text-xs text-gray-500 mt-1">${project.startDate} to ${project.endDate}</p>
                            </div>
                            <span class="px-2 py-1 rounded text-xs font-medium ${getStatusClass(project.status)}">${project.status}</span>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    renderGanttChart();
    renderCapacityChart();
}

function setGanttDateRange(range) {
    ganttDateRange = range;
    renderRoadmap();
}

function setResourceDateRange(range) {
    resourceDateRange = range;
    renderResources();
}

function renderGanttChart() {
    const ctx = document.getElementById('gantt-chart');
    if (!ctx) return;
    
    // Destroy previous chart instance to prevent Canvas reuse errors
    if (ganttChartInstance) {
        ganttChartInstance.destroy();
    }
    
    // Get date range based on ganttDateRange selection
    let startDate, endDate;
    const currentYear = new Date().getFullYear();
    
    if (ganttDateRange === 'all') {
        // Show all projects - use very wide date range
        startDate = new Date('2020-01-01');
        endDate = new Date('2030-12-31');
    } else if (ganttDateRange === 'custom') {
        startDate = ganttCustomStart ? new Date(ganttCustomStart) : new Date(`${currentYear}-01-01`);
        endDate = ganttCustomEnd ? new Date(ganttCustomEnd) : new Date(`${currentYear}-12-31`);
    } else {
        // Specific year selected
        const year = parseInt(ganttDateRange);
        startDate = new Date(`${year}-01-01`);
        endDate = new Date(`${year}-12-31`);
    }
    
    // Filter projects by owner/priority/status AND date range
    const filteredProjects = getFilteredProjects().filter(p => {
        const pStart = new Date(p.startDate);
        const pEnd = new Date(p.endDate);
        // Include project if it overlaps with the selected date range
        return pStart <= endDate && pEnd >= startDate;
    });
    
    const sortedProjects = [...filteredProjects].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    // Create dataset with floating bars representing project timelines
    const datasets = sortedProjects.map(p => {
        const pStart = new Date(p.startDate);
        const pEnd = new Date(p.endDate);
        
        return {
            label: p.name,
            data: [{
                x: [pStart, pEnd],
                y: p.name
            }],
            backgroundColor: getStatusColor(p.status, 0.7),
            borderColor: getStatusColor(p.status, 1),
            borderWidth: 2,
            barThickness: 20
        };
    });
    
    ganttChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedProjects.map(p => p.name),
            datasets: datasets
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        displayFormats: {
                            month: 'MMM yyyy'
                        }
                    },
                    min: startDate,
                    max: endDate,
                    title: {
                        display: true,
                        text: 'Timeline'
                    }
                },
                y: {
                    stacked: false
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const data = context.raw;
                            const start = new Date(data.x[0]).toLocaleDateString();
                            const end = new Date(data.x[1]).toLocaleDateString();
                            return `${start} - ${end}`;
                        }
                    }
                }
            }
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
    
    // Destroy previous chart instance
    if (capacityChartInstance) {
        capacityChartInstance.destroy();
    }
    
    const filteredProjects = getFilteredProjects();
    
    const capacityData = engineers.map(eng => {
        const nonProjectTotal = eng.nonProjectTime.reduce((sum, item) => sum + item.hours, 0);
        const projectHours = filteredProjects
            .filter(p => !['Planned', 'Completed', 'Cancelled'].includes(p.status))
            .flatMap(p => p.tasks)
            .filter(t => t.engineer === eng.name)
            .reduce((sum, t) => sum + t.hoursPerWeek, 0);
        const available = eng.totalHours - nonProjectTotal - projectHours;
        return { name: eng.name, nonProject: nonProjectTotal, project: projectHours, available: Math.max(0, available) };
    });
    
    capacityChartInstance = new Chart(ctx, {
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
    const container = document.getElementById('content-milestones');
    const currentYear = new Date().getFullYear();
    const yearOptions = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2, currentYear + 3, currentYear + 4];
    const hasActiveFilters = ownerFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all';
    
    // Get milestones from filtered projects based on date range
    const filteredProjects = getFilteredProjects();
    const dateRange = getMilestoneDateRange();
    
    const allMilestones = filteredProjects.flatMap(p => p.milestones.map(m => ({ ...m, projectName: p.name, projectId: p.id })))
        .filter(m => {
            const mDate = new Date(m.plannedDate);
            return mDate >= dateRange.start && mDate <= dateRange.end;
        });
    
    const completed = allMilestones.filter(m => m.status === 'completed').length;
    const atRisk = allMilestones.filter(m => m.status === 'at-risk').length;
    const overdue = allMilestones.filter(m => m.status !== 'completed' && new Date(m.plannedDate) < new Date()).length;
    const completionRate = allMilestones.length > 0 ? Math.round((completed / allMilestones.length) * 100) : 0;
    
    // Calculate variance
    const plannedByNow = allMilestones.filter(m => new Date(m.plannedDate) <= new Date()).length;
    const variance = completed - plannedByNow;
    
    container.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Milestone Tracking</h2>
        
        <!-- Date Range Selector -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
            <div class="flex items-center space-x-4 mb-2">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span class="font-medium text-gray-700">Date Range:</span>
            </div>
            <div class="flex items-center space-x-2 flex-wrap gap-2">
                ${yearOptions.map(year => `
                    <button onclick="setMilestoneDateRange('${year}')" class="px-3 py-1 rounded ${milestoneDateRange === String(year) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">${year}</button>
                `).join('')}
                <button onclick="setMilestoneDateRange('all')" class="px-3 py-1 rounded ${milestoneDateRange === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">All Time</button>
                <button onclick="setMilestoneDateRange('custom')" class="px-3 py-1 rounded ${milestoneDateRange === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">Custom</button>
            </div>
            ${milestoneDateRange === 'custom' ? `
            <div class="mt-3 flex items-center space-x-4">
                <div>
                    <label class="block text-sm text-gray-600 mb-1">Start Date</label>
                    <input type="date" value="${milestoneCustomStart}" onchange="milestoneCustomStart = this.value; renderMilestones();" class="px-3 py-1 border border-gray-300 rounded">
                </div>
                <div>
                    <label class="block text-sm text-gray-600 mb-1">End Date</label>
                    <input type="date" value="${milestoneCustomEnd}" onchange="milestoneCustomEnd = this.value; renderMilestones();" class="px-3 py-1 border border-gray-300 rounded">
                </div>
            </div>` : ''}
        </div>
        
        <!-- Summary Cards -->
        <div class="grid grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600">Total Milestones</p>
                        <p class="text-sm text-gray-500">${milestoneDateRange === 'all' ? 'All Time' : milestoneDateRange === 'custom' ? 'Custom' : milestoneDateRange}</p>
                        ${hasActiveFilters ? '<p class="text-xs text-gray-400">(filtered)</p>' : ''}
                    </div>
                    <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <p class="text-3xl font-bold text-gray-800 mt-2">${allMilestones.length}</p>
            </div>
            <div class="bg-white rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600">Completed</p>
                    </div>
                    <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <p class="text-3xl font-bold text-green-600 mt-2">${completed} <span class="text-sm text-gray-500">(${completionRate}%)</span></p>
            </div>
            <div class="bg-white rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600">At Risk</p>
                    </div>
                    <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <p class="text-3xl font-bold text-yellow-600 mt-2">${atRisk}</p>
            </div>
            <div class="bg-white rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600">Overdue</p>
                        <p class="text-xs text-gray-400">Variance: <span class="${variance >= 0 ? 'text-green-600' : 'text-red-600'}">${variance >= 0 ? '+' : ''}${variance}</span></p>
                    </div>
                    <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <p class="text-3xl font-bold text-red-600 mt-2">${overdue}</p>
            </div>
        </div>
        
        <!-- Cumulative Milestone Chart -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Cumulative Milestone Progress</h3>
            <div class="chart-container" style="height: 250px;"><canvas id="milestone-cumulative-chart"></canvas></div>
        </div>
        
        <!-- All Milestones List -->
        <div class="bg-white rounded-lg shadow-md p-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">All Milestones</h3>
            <div class="space-y-2" id="all-milestones-list"></div>
        </div>
    `;
    
    // Render milestones list
    const list = document.getElementById('all-milestones-list');
    const sorted = allMilestones.sort((a, b) => new Date(a.plannedDate) - new Date(b.plannedDate));
    
    if (sorted.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-center py-6">No milestones found</p>';
    } else {
        list.innerHTML = sorted.map(m => {
            const isOverdue = m.status !== 'completed' && new Date(m.plannedDate) < new Date();
            const bgClass = m.status === 'completed' ? 'bg-green-50 border-green-200' : (m.status === 'at-risk' || isOverdue) ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200';
            
            // Build action buttons based on status
            let actionButtons = '';
            if (m.status !== 'completed') {
                actionButtons = `
                    <div class="flex items-center space-x-2">
                        ${m.status !== 'at-risk' ? `<button onclick="updateMilestoneStatusFromTab(${m.id}, ${m.projectId}, 'at-risk')" class="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200">Mark At Risk</button>` : ''}
                        <button onclick="updateMilestoneStatusFromTab(${m.id}, ${m.projectId}, 'completed')" class="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200">Complete</button>
                    </div>
                `;
            }
            
            return `
                <div class="p-3 rounded-lg border ${bgClass}">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3 flex-1">
                            ${m.status === 'completed' ? '<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' : (m.status === 'at-risk' || isOverdue) ? '<svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>' : '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'}
                            <div class="flex-1">
                                <span class="font-medium text-gray-800">${m.name}</span>
                                <p class="text-sm text-gray-600">
                                    ${m.projectName} • Planned: ${m.plannedDate}
                                    ${m.actualDate ? ` • Completed: ${m.actualDate}` : ''}
                                    ${isOverdue && !m.actualDate ? ' • <span class="text-red-600 font-medium">OVERDUE</span>' : ''}
                                </p>
                            </div>
                        </div>
                        ${actionButtons}
                    </div>
                </div>
            `;
        }).join('');

    }
    
    // Render cumulative chart
    renderMilestoneCumulativeChart(allMilestones, dateRange);
}

function getMilestoneDateRange() {
    const currentYear = new Date().getFullYear();
    if (milestoneDateRange === 'custom') {
        return {
            start: milestoneCustomStart ? new Date(milestoneCustomStart + 'T00:00:00') : new Date(`${currentYear}-01-01T00:00:00`),
            end: milestoneCustomEnd ? new Date(milestoneCustomEnd + 'T23:59:59') : new Date(`${currentYear}-12-31T23:59:59`)
        };
    }
    if (milestoneDateRange === 'all') {
        return {
            start: new Date(`${currentYear - 1}-01-01T00:00:00`),
            end: new Date(`${currentYear + 4}-12-31T23:59:59`)
        };
    }
    const year = parseInt(milestoneDateRange);
    return {
        start: new Date(`${year}-01-01T00:00:00`),
        end: new Date(`${year}-12-31T23:59:59`)
    };
}

function setMilestoneDateRange(range) {
    milestoneDateRange = range;
    renderMilestones();
}

function renderMilestoneCumulativeChart(milestones, dateRange) {
    const ctx = document.getElementById('milestone-cumulative-chart');
    if (!ctx) return;
    
    // Destroy previous chart instance
    if (milestoneCumulativeChartInstance) {
        milestoneCumulativeChartInstance.destroy();
    }
    
    // Generate months for the date range
    const months = [];
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
        months.push(d.toISOString().slice(0, 7));
    }
    
    // Calculate cumulative data
    const cumulativeData = months.map(month => {
        const monthEnd = month + '-31';
        const plannedByMonth = milestones.filter(m => m.plannedDate <= monthEnd).length;
        const completedByMonth = milestones.filter(m => m.actualDate && m.actualDate <= monthEnd).length;
        return { month, planned: plannedByMonth, actual: completedByMonth };
    });
    
    milestoneCumulativeChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: cumulativeData.map(d => d.month),
            datasets: [{
                label: 'Planned (Cumulative)',
                data: cumulativeData.map(d => d.planned),
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.3
            }, {
                label: 'Completed (Cumulative)',
                data: cumulativeData.map(d => d.actual),
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Milestones' } }
            },
            plugins: { legend: { display: true } }
        }
    });
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
    
    // Calculate summary metrics
    const totalCapacity = engineers.reduce((sum, e) => sum + e.totalHours, 0);
    const totalAvailable = capacityData.reduce((sum, e) => sum + e.available, 0);
    const avgUtilization = capacityData.length > 0 
        ? Math.round(capacityData.reduce((sum, e) => sum + e.utilization, 0) / capacityData.length) 
        : 0;
    const overloadedCount = capacityData.filter(e => e.utilization > 100).length;
    
    // Year options for date range selector
    const currentYear = new Date().getFullYear();
    const yearOptions = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2, currentYear + 3, currentYear + 4];
    
    container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-800">Resource Management</h2>
            <button onclick="openEngineerModal()" class="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                <span>Add Engineer</span>
            </button>
        </div>
        
        <!-- Summary Cards -->
        <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <p class="text-sm text-gray-600">Team Capacity</p>
                    <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold text-gray-800 mt-2">${totalCapacity}h</p>
                <p class="text-sm text-gray-500 mt-1">${totalAvailable}h available</p>
            </div>
            <div class="bg-white rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <p class="text-sm text-gray-600">Avg Utilization</p>
                    <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold text-gray-800 mt-2">${avgUtilization}%</p>
                <p class="text-sm text-gray-500 mt-1">Across team</p>
            </div>
            <div class="bg-white rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <p class="text-sm text-gray-600">Overloaded</p>
                    <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold text-gray-800 mt-2">${overloadedCount}</p>
                <p class="text-sm text-gray-500 mt-1">Engineer${overloadedCount !== 1 ? 's' : ''}</p>
            </div>
            </div>
        </div>
        
        <!-- Date Range Selector for Capacity Charts -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
            <div class="flex items-center space-x-4 mb-2">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span class="font-medium text-gray-700">Capacity Timeline:</span>
            </div>
            <div class="flex items-center space-x-2 flex-wrap gap-2">
                ${yearOptions.map(year => `
                    <button onclick="setResourceDateRange('${year}')" class="px-3 py-1 rounded ${resourceDateRange === String(year) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">${year}</button>
                `).join('')}
                <button onclick="setResourceDateRange('all')" class="px-3 py-1 rounded ${resourceDateRange === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">All Time</button>
                <button onclick="setResourceDateRange('custom')" class="px-3 py-1 rounded ${resourceDateRange === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">Custom</button>
            </div>
            ${resourceDateRange === 'custom' ? `
            <div class="mt-3 flex items-center space-x-4">
                <div>
                    <label class="block text-sm text-gray-600 mb-1">Start Date</label>
                    <input type="date" id="resource-custom-start" value="${resourceCustomStart}" onchange="resourceCustomStart = this.value; renderResources();" class="px-3 py-1 border border-gray-300 rounded">
                </div>
                <div>
                    <label class="block text-sm text-gray-600 mb-1">End Date</label>
                    <input type="date" id="resource-custom-end" value="${resourceCustomEnd}" onchange="resourceCustomEnd = this.value; renderResources();" class="px-3 py-1 border border-gray-300 rounded">
                </div>
            </div>` : ''}
        </div>
        
        <!-- Current Week Capacity Chart -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Current Week Capacity</h3>
            <div class="chart-container"><canvas id="current-capacity-chart"></canvas></div>
        </div>
        
        <!-- Team Capacity Over Time Chart -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Team Capacity Allocation Over Time - ${resourceDateRange === 'all' ? 'All Years' : resourceDateRange === 'custom' ? 'Custom Range' : resourceDateRange}</h3>
            <div class="chart-container"><canvas id="team-capacity-chart"></canvas></div>
        </div>
        
        <!-- Individual Utilization Trends Chart -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Individual Capacity Utilization Trends - ${resourceDateRange === 'all' ? 'All Years' : resourceDateRange === 'custom' ? 'Custom Range' : resourceDateRange}</h3>
            <div class="chart-container"><canvas id="individual-trends-chart"></canvas></div>
        </div>
        
        <!-- Monthly Breakdown Table -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Monthly Breakdown by Engineer - ${resourceDateRange === 'all' ? 'All Years' : resourceDateRange === 'custom' ? 'Custom Range' : resourceDateRange}</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                    <thead>
                        <tr class="border-b border-gray-300">
                            <th class="text-left p-2 font-semibold">Engineer</th>
                            ${Array.from({length: 12}, (_, i) => {
                                const month = new Date(new Date().getFullYear(), i, 1).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' });
                                return `<th class="text-center p-2 font-semibold whitespace-nowrap">${month}</th>`;
                            }).join('')}
                        </tr>
                    </thead>
                    <tbody id="monthly-breakdown-tbody">
                    </tbody>
                </table>
            </div>
            <p class="text-xs text-gray-500 mt-3">P = Project hours, NP = Non-Project hours, A = Available hours</p>
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
    
    // Render the charts after DOM is updated
    setTimeout(() => {
        renderCurrentCapacityChart();
        renderTeamCapacityOverTime();
        renderIndividualTrendsChart();
        renderMonthlyBreakdownTable();
    }, 0);
}

let currentCapacityChartInstance = null;
let teamCapacityChartInstance = null;
let individualTrendsChartInstance = null;

function renderCurrentCapacityChart() {
    const ctx = document.getElementById('current-capacity-chart');
    if (!ctx) return;
    
    if (currentCapacityChartInstance) {
        currentCapacityChartInstance.destroy();
    }
    
    const capacityData = engineers.map(eng => {
        const nonProjectTotal = eng.nonProjectTime.reduce((sum, item) => sum + item.hours, 0);
        const projectHours = projects
            .filter(p => !['Planned', 'Completed', 'Cancelled'].includes(p.status))
            .flatMap(p => p.tasks)
            .filter(t => t.engineer === eng.name)
            .reduce((sum, t) => sum + t.hoursPerWeek, 0);
        const available = eng.totalHours - nonProjectTotal - projectHours;
        return {
            name: eng.name,
            nonProject: nonProjectTotal,
            project: projectHours,
            available: Math.max(0, available)
        };
    });
    
    currentCapacityChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: capacityData.map(e => e.name),
            datasets: [
                {
                    label: 'Non-Project Time',
                    data: capacityData.map(e => e.nonProject),
                    backgroundColor: '#94a3b8'
                },
                {
                    label: 'Project Work',
                    data: capacityData.map(e => e.project),
                    backgroundColor: '#3b82f6'
                },
                {
                    label: 'Available',
                    data: capacityData.map(e => e.available),
                    backgroundColor: '#10b981'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true },
                y: {
                    stacked: true,
                    title: { display: true, text: 'Hours/Week' }
                }
            }
        }
    });
}

function renderTeamCapacityOverTime() {
    const ctx = document.getElementById('team-capacity-chart');
    if (!ctx) return;
    
    if (teamCapacityChartInstance) {
        teamCapacityChartInstance.destroy();
    }
    
    // Calculate date range based on resourceDateRange
    const currentYear = new Date().getFullYear();
    let startYear, endYear;
    
    if (resourceDateRange === 'all') {
        startYear = currentYear - 1;
        endYear = currentYear + 4;
    } else if (resourceDateRange === 'custom') {
        if (!resourceCustomStart || !resourceCustomEnd) {
            // Default to current year if custom dates not set
            startYear = endYear = currentYear;
        } else {
            startYear = new Date(resourceCustomStart).getFullYear();
            endYear = new Date(resourceCustomEnd).getFullYear();
        }
    } else {
        // Specific year selected
        startYear = endYear = parseInt(resourceDateRange);
    }
    
    const monthlyData = [];
    
    // Generate data for all months in the selected year range
    for (let year = startYear; year <= endYear; year++) {
        for (let month = 0; month < 12; month++) {
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0);
            const monthKey = monthStart.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' });
            
            let totalNonProject = 0;
            let totalProject = 0;
            let totalCapacity = 0;
            
            engineers.forEach(eng => {
                const nonProject = eng.nonProjectTime.reduce((sum, item) => sum + item.hours, 0);
                const projectHours = projects
                    .filter(p => {
                        const pStart = new Date(p.startDate);
                        const pEnd = new Date(p.endDate);
                        return pStart <= monthEnd && pEnd >= monthStart;
                    })
                    .flatMap(p => p.tasks)
                    .filter(t => t.engineer === eng.name)
                    .reduce((sum, t) => sum + t.hoursPerWeek, 0);
                
                totalNonProject += nonProject;
                totalProject += projectHours;
                totalCapacity += eng.totalHours;
            });
            
            const available = totalCapacity - totalNonProject - totalProject;
            
            monthlyData.push({
                month: monthKey,
                nonProject: totalNonProject,
                project: totalProject,
                available: Math.max(0, available)
            });
        }
    }
    
    teamCapacityChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthlyData.map(m => m.month),
            datasets: [
                {
                    label: 'Non-Project Time',
                    data: monthlyData.map(m => m.nonProject),
                    backgroundColor: '#94a3b8'
                },
                {
                    label: 'Project Work',
                    data: monthlyData.map(m => m.project),
                    backgroundColor: '#3b82f6'
                },
                {
                    label: 'Available',
                    data: monthlyData.map(m => m.available),
                    backgroundColor: '#10b981'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { 
                    stacked: true,
                    ticks: { maxRotation: 45, minRotation: 45 }
                },
                y: {
                    stacked: true,
                    title: { display: true, text: 'Hours/Week' }
                }
            }
        }
    });
}

function renderIndividualTrendsChart() {
    const ctx = document.getElementById('individual-trends-chart');
    if (!ctx) return;
    
    if (individualTrendsChartInstance) {
        individualTrendsChartInstance.destroy();
    }
    
    // Calculate date range based on resourceDateRange
    const currentYear = new Date().getFullYear();
    let startYear, endYear;
    
    if (resourceDateRange === 'all') {
        startYear = currentYear - 1;
        endYear = currentYear + 4;
    } else if (resourceDateRange === 'custom') {
        if (!resourceCustomStart || !resourceCustomEnd) {
            startYear = endYear = currentYear;
        } else {
            startYear = new Date(resourceCustomStart).getFullYear();
            endYear = new Date(resourceCustomEnd).getFullYear();
        }
    } else {
        startYear = endYear = parseInt(resourceDateRange);
    }
    
    // Generate month objects instead of strings to avoid parsing issues
    const months = [];
    for (let year = startYear; year <= endYear; year++) {
        for (let month = 0; month < 12; month++) {
            months.push({
                year: year,
                month: month,
                label: new Date(year, month, 1).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' })
            });
        }
    }
    
    const engineerColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    
    const datasets = engineers.map((eng, idx) => {
        const data = months.map(monthObj => {
            const monthStart = new Date(monthObj.year, monthObj.month, 1);
            const monthEnd = new Date(monthObj.year, monthObj.month + 1, 0);
            
            const nonProject = eng.nonProjectTime.reduce((sum, item) => sum + item.hours, 0);
            const projectHours = projects
                .filter(p => {
                    const pStart = new Date(p.startDate);
                    const pEnd = new Date(p.endDate);
                    return pStart <= monthEnd && pEnd >= monthStart;
                })
                .flatMap(p => p.tasks)
                .filter(t => t.engineer === eng.name)
                .reduce((sum, t) => sum + t.hoursPerWeek, 0);
            
            const utilization = ((nonProject + projectHours) / eng.totalHours) * 100;
            return Math.round(utilization);
        });
        
        return {
            label: eng.name,
            data: data,
            borderColor: engineerColors[idx % engineerColors.length],
            backgroundColor: engineerColors[idx % engineerColors.length] + '33',
            tension: 0.1
        };
    });
    
    individualTrendsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(m => m.label),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { maxRotation: 45, minRotation: 45 }
                },
                y: {
                    min: 0,
                    max: 120,
                    title: { display: true, text: 'Utilization %' }
                }
            },
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function renderMonthlyBreakdownTable() {
    const tbody = document.getElementById('monthly-breakdown-tbody');
    if (!tbody) return;
    
    // Calculate date range based on resourceDateRange
    const currentYear = new Date().getFullYear();
    let startYear, endYear;
    
    if (resourceDateRange === 'all') {
        startYear = currentYear - 1;
        endYear = currentYear + 4;
    } else if (resourceDateRange === 'custom') {
        if (!resourceCustomStart || !resourceCustomEnd) {
            startYear = endYear = currentYear;
        } else {
            startYear = new Date(resourceCustomStart).getFullYear();
            endYear = new Date(resourceCustomEnd).getFullYear();
        }
    } else {
        startYear = endYear = parseInt(resourceDateRange);
    }
    
    const rows = engineers.map(eng => {
        const cells = [];
        
        for (let year = startYear; year <= endYear; year++) {
            for (let month = 0; month < 12; month++) {
                const monthStart = new Date(year, month, 1);
                const monthEnd = new Date(year, month + 1, 0);
            
            const nonProject = eng.nonProjectTime.reduce((sum, item) => sum + item.hours, 0);
            const projectHours = projects
                .filter(p => {
                    const pStart = new Date(p.startDate);
                    const pEnd = new Date(p.endDate);
                    return pStart <= monthEnd && pEnd >= monthStart;
                })
                .flatMap(p => p.tasks)
                .filter(t => t.engineer === eng.name)
                .reduce((sum, t) => sum + t.hoursPerWeek, 0);
            
            const available = eng.totalHours - nonProject - projectHours;
            const utilization = Math.round(((nonProject + projectHours) / eng.totalHours) * 100);
            
            const utilizationColor = utilization > 100 ? 'text-red-600' : 
                                      utilization > 85 ? 'text-yellow-600' : 
                                      'text-green-600';
            
                cells.push(`
                    <td class="p-2 text-center">
                        <div class="text-xs">
                            <div class="text-gray-600">P:${projectHours}</div>
                            <div class="text-gray-600">NP:${nonProject}</div>
                            <div class="text-gray-600">A:${available}</div>
                            <div class="font-semibold mt-1 ${utilizationColor}">${utilization}%</div>
                        </div>
                    </td>
                `);
            }
        }
        
        return `
            <tr class="border-b border-gray-200 hover:bg-gray-50">
                <td class="p-2 font-medium text-gray-800 whitespace-nowrap">${eng.name}</td>
                ${cells.join('')}
            </tr>
        `;
    });
    
    // Add team totals row
    const totalCells = [];
    for (let year = startYear; year <= endYear; year++) {
        for (let month = 0; month < 12; month++) {
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0);
        
        let totalNonProject = 0;
        let totalProject = 0;
        let totalCapacity = 0;
        
        engineers.forEach(eng => {
            const nonProject = eng.nonProjectTime.reduce((sum, item) => sum + item.hours, 0);
            const projectHours = projects
                .filter(p => {
                    const pStart = new Date(p.startDate);
                    const pEnd = new Date(p.endDate);
                    return pStart <= monthEnd && pEnd >= monthStart;
                })
                .flatMap(p => p.tasks)
                .filter(t => t.engineer === eng.name)
                .reduce((sum, t) => sum + t.hoursPerWeek, 0);
            
            totalNonProject += nonProject;
            totalProject += projectHours;
            totalCapacity += eng.totalHours;
        });
        
        const totalAvailable = totalCapacity - totalNonProject - totalProject;
        const totalUtilization = Math.round(((totalNonProject + totalProject) / totalCapacity) * 100);
        
        const utilizationColor = totalUtilization > 100 ? 'text-red-600' : 
                                  totalUtilization > 85 ? 'text-yellow-600' : 
                                  'text-green-600';
        
            totalCells.push(`
                <td class="p-2 text-center">
                    <div class="text-xs">
                        <div class="text-gray-700">P:${totalProject}</div>
                        <div class="text-gray-700">NP:${totalNonProject}</div>
                        <div class="text-gray-700">A:${totalAvailable}</div>
                        <div class="font-bold mt-1 ${utilizationColor}">${totalUtilization}%</div>
                    </div>
                </td>
            `);
        }
    }
    
    tbody.innerHTML = rows.join('') + `
        <tr class="border-t-2 border-gray-400 bg-gray-100 font-semibold">
            <td class="p-2">TEAM TOTAL</td>
            ${totalCells.join('')}
        </tr>
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
