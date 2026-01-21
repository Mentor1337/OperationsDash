import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, ComposedChart, Scatter, ZAxis
} from 'recharts';
import { 
  Calendar, CheckCircle, AlertCircle, Clock, Users, 
  TrendingUp, Edit, Plus, X, Filter, ChevronDown, ChevronRight 
} from 'lucide-react';

const OperationsDashboard = () => {
  // Sample data - will be customizable
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: "Battery Stacking Automation",
      owner: "Mike Rodriguez",
      priority: "Critical",
      status: "On Track",
      progress: 65,
      startDate: "2024-11-01",
      endDate: "2025-06-30",
      estimatedHoursPerWeek: 20,
      budget: 125000,
      spent: 81250,
      notes: "Procurement phase complete. Installation begins next month.",
      changeHistory: [],
      expenses: [
        { id: 1, date: "2024-11-15", description: "Equipment procurement", amount: 75000, category: "Equipment" },
        { id: 2, date: "2024-12-01", description: "Installation contractor deposit", amount: 6250, category: "Labor" }
      ],
      tasks: [
        { engineer: "Mike Rodriguez", hoursPerWeek: 15 },
        { engineer: "Sarah Chen", hoursPerWeek: 10 }
      ],
      milestones: [
        { id: 1, name: "Equipment Procurement", plannedDate: "2024-12-15", actualDate: "2024-12-10", status: "completed" },
        { id: 2, name: "Installation Complete", plannedDate: "2025-03-01", actualDate: null, status: "pending" },
        { id: 3, name: "System Testing", plannedDate: "2025-05-15", actualDate: null, status: "pending" }
      ]
    },
    {
      id: 2,
      name: "FAT Protocol Development",
      owner: "Sarah Chen",
      priority: "High",
      status: "At Risk",
      progress: 45,
      startDate: "2024-10-15",
      endDate: "2025-04-30",
      estimatedHoursPerWeek: 25,
      budget: 45000,
      spent: 28500,
      notes: "Resource constraints delaying completion. Need additional test equipment.",
      changeHistory: [],
      expenses: [
        { id: 3, date: "2024-10-20", description: "Test equipment", amount: 18500, category: "Equipment" },
        { id: 4, date: "2024-11-10", description: "Consultant fees", amount: 10000, category: "Services" }
      ],
      tasks: [
        { engineer: "Sarah Chen", hoursPerWeek: 20 },
        { engineer: "Tom Williams", hoursPerWeek: 5 }
      ],
      milestones: [
        { id: 4, name: "Protocol Draft", plannedDate: "2024-11-30", actualDate: "2024-12-05", status: "completed" },
        { id: 5, name: "Validation Testing", plannedDate: "2025-02-15", actualDate: null, status: "at-risk" },
        { id: 6, name: "Final Approval", plannedDate: "2025-04-30", actualDate: null, status: "pending" }
      ]
    },
    {
      id: 3,
      name: "Volume Ramp Preparation",
      owner: "Mike Rodriguez",
      priority: "Critical",
      status: "Planned",
      progress: 0,
      startDate: "2026-03-01",
      endDate: "2026-12-31",
      estimatedHoursPerWeek: 30,
      budget: 500000,
      spent: 0,
      notes: "2027 volume increase preparation. Equipment and process validation.",
      changeHistory: [],
      expenses: [],
      tasks: [
        { engineer: "Mike Rodriguez", hoursPerWeek: 15 },
        { engineer: "Jessica Park", hoursPerWeek: 15 }
      ],
      milestones: [
        { id: 7, name: "Capacity Analysis", plannedDate: "2026-04-15", actualDate: null, status: "pending" },
        { id: 8, name: "Equipment Orders", plannedDate: "2026-06-30", actualDate: null, status: "pending" },
        { id: 9, name: "Line Validation", plannedDate: "2026-10-31", actualDate: null, status: "pending" }
      ]
    },
    {
      id: 4,
      name: "Quality System Upgrade",
      owner: "Tom Williams",
      priority: "Medium",
      status: "Behind",
      progress: 30,
      startDate: "2024-09-01",
      endDate: "2025-03-31",
      estimatedHoursPerWeek: 15,
      budget: 85000,
      spent: 52000,
      notes: "Software integration issues. Vendor support required.",
      changeHistory: [],
      expenses: [
        { id: 5, date: "2024-09-15", description: "Software license", amount: 35000, category: "Software" },
        { id: 6, date: "2024-10-01", description: "Vendor implementation", amount: 17000, category: "Services" }
      ],
      tasks: [
        { engineer: "Tom Williams", hoursPerWeek: 10 },
        { engineer: "Jessica Park", hoursPerWeek: 5 }
      ],
      milestones: [
        { id: 10, name: "Software Selection", plannedDate: "2024-10-15", actualDate: "2024-11-01", status: "completed" },
        { id: 11, name: "Data Migration", plannedDate: "2025-01-15", actualDate: null, status: "at-risk" },
        { id: 12, name: "Go-Live", plannedDate: "2025-03-31", actualDate: null, status: "pending" }
      ]
    }
  ]);

  const [engineers, setEngineers] = useState([
    { 
      name: "Mike Rodriguez", 
      role: "Senior Operations Engineer",
      totalHours: 40,
      nonProjectTime: [
        { type: "Line Support", hours: 8 },
        { type: "Meetings", hours: 3 }
      ]
    },
    { 
      name: "Sarah Chen", 
      role: "Process Engineer",
      totalHours: 40,
      nonProjectTime: [
        { type: "Line Support", hours: 10 },
        { type: "Training", hours: 2 }
      ]
    },
    { 
      name: "Tom Williams", 
      role: "Quality Engineer",
      totalHours: 40,
      nonProjectTime: [
        { type: "Line Support", hours: 15 },
        { type: "Equipment Maintenance", hours: 5 },
        { type: "Meetings", hours: 2 }
      ]
    },
    { 
      name: "Jessica Park", 
      role: "Manufacturing Engineer",
      totalHours: 40,
      nonProjectTime: [
        { type: "Line Support", hours: 12 },
        { type: "Documentation", hours: 3 }
      ]
    }
  ]);

  const [activeTab, setActiveTab] = useState('projects');
  const [editingProject, setEditingProject] = useState(null);
  const [editingEngineer, setEditingEngineer] = useState(null);
  const [managingExpenses, setManagingExpenses] = useState(null);
  const [managingMilestones, setManagingMilestones] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [managingTasks, setManagingTasks] = useState(null);
  const [managingEngineers, setManagingEngineers] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState(new Set([1]));
  const [showAddProject, setShowAddProject] = useState(false);
  
  // Filters
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showMilestones, setShowMilestones] = useState(true);
  
  // Date range for Gantt and Milestones
  const [ganttDateRange, setGanttDateRange] = useState(String(new Date().getFullYear()));
  const [ganttCustomStart, setGanttCustomStart] = useState('');
  const [ganttCustomEnd, setGanttCustomEnd] = useState('');
  
  const [milestoneDateRange, setMilestoneDateRange] = useState(String(new Date().getFullYear()));
  const [milestoneCustomStart, setMilestoneCustomStart] = useState('');
  const [milestoneCustomEnd, setMilestoneCustomEnd] = useState('');
  
  const [capacityDateRange, setCapacityDateRange] = useState(String(new Date().getFullYear()));
  const [capacityCustomStart, setCapacityCustomStart] = useState('');
  const [capacityCustomEnd, setCapacityCustomEnd] = useState('');

  // Dynamic year ranges - previous year, current year, and next 4 years
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2,
    currentYear + 3,
    currentYear + 4
  ];

  // Calculate capacity
  const calculateCapacity = () => {
    return engineers.map(eng => {
      const nonProjectTotal = eng.nonProjectTime.reduce((sum, item) => sum + item.hours, 0);
      const projectHours = projects
        .filter(p => !['Planned', 'Completed', 'Cancelled'].includes(p.status))
        .flatMap(p => p.tasks)
        .filter(t => t.engineer === eng.name)
        .reduce((sum, t) => sum + t.hoursPerWeek, 0);
      
      const available = eng.totalHours - nonProjectTotal - projectHours;
      const utilization = ((eng.totalHours - available) / eng.totalHours) * 100;
      
      return {
        ...eng,
        nonProjectTotal,
        projectHours,
        available,
        utilization
      };
    });
  };

  const capacityData = useMemo(() => calculateCapacity(), [engineers, projects]);

  // Status colors
  const getStatusColor = (status) => {
    const colors = {
      'On Track': 'bg-green-100 text-green-800 border-green-300',
      'At Risk': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Behind': 'bg-red-100 text-red-800 border-red-300',
      'Planned': 'bg-blue-100 text-blue-800 border-blue-300',
      'Completed': 'bg-purple-100 text-purple-800 border-purple-300',
      'Cancelled': 'bg-gray-100 text-gray-500 border-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusBarColor = (status) => {
    const colors = {
      'On Track': '#10b981',
      'At Risk': '#f59e0b',
      'Behind': '#ef4444',
      'Planned': '#3b82f6',
      'Completed': '#8b5cf6',
      'Cancelled': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  // Toggle project expansion
  const toggleProject = (id) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedProjects(newExpanded);
  };

  // Edit project
  const handleEditProject = (project) => {
    setEditingProject({ ...project });
  };

  const handleSaveProject = () => {
    const originalProject = projects.find(p => p.id === editingProject.id);
    const changes = [];
    const timestamp = new Date().toISOString();

    // Track start date changes
    if (originalProject.startDate !== editingProject.startDate) {
      changes.push({
        field: 'Start Date',
        oldValue: originalProject.startDate,
        newValue: editingProject.startDate,
        changedAt: timestamp,
        changedBy: editingProject.owner
      });
    }

    // Track end date changes
    if (originalProject.endDate !== editingProject.endDate) {
      changes.push({
        field: 'End Date',
        oldValue: originalProject.endDate,
        newValue: editingProject.endDate,
        changedAt: timestamp,
        changedBy: editingProject.owner
      });
    }

    // Ensure owner is in tasks with estimatedHoursPerWeek
    let updatedTasks = [...editingProject.tasks];
    const ownerTask = updatedTasks.find(t => t.engineer === editingProject.owner);

    if (ownerTask) {
      // Update owner's hours to match estimated hours if they exist
      updatedTasks = updatedTasks.map(t =>
        t.engineer === editingProject.owner
          ? { ...t, hoursPerWeek: editingProject.estimatedHoursPerWeek }
          : t
      );
    } else if (editingProject.estimatedHoursPerWeek > 0) {
      // Add owner as a new task assignment
      updatedTasks.push({
        engineer: editingProject.owner,
        hoursPerWeek: editingProject.estimatedHoursPerWeek
      });
    }

    // Add changes to history
    const updatedProject = {
      ...editingProject,
      tasks: updatedTasks,
      changeHistory: [...(editingProject.changeHistory || []), ...changes]
    };

    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    setEditingProject(null);
  };

  // Add project
  const handleAddProject = () => {
    const newProject = {
      id: Math.max(...projects.map(p => p.id)) + 1,
      name: "New Project",
      owner: engineers[0]?.name || "Unassigned",
      priority: "Medium",
      status: "Planned",
      progress: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedHoursPerWeek: 10,
      budget: 0,
      spent: 0,
      notes: "",
      changeHistory: [],
      expenses: [],
      tasks: engineers[0] ? [{ engineer: engineers[0].name, hoursPerWeek: 10 }] : [],
      milestones: []
    };
    setProjects([...projects, newProject]);
    setEditingProject(newProject);
    setShowAddProject(false);
  };

  // Calculate monthly capacity data
  const calculateMonthlyCapacity = () => {
    const months = [];
    const currentYear = new Date().getFullYear();

    // Generate months from previous year to current+4
    for (let year = currentYear - 1; year <= currentYear + 4; year++) {
      for (let month = 0; month < 12; month++) {
        months.push({ year, month });
      }
    }

    return months.map(({ year, month }) => {
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      let totalNonProject = 0;
      let totalProject = 0;
      let totalCapacity = 0;

      engineers.forEach(eng => {
        const nonProject = eng.nonProjectTime.reduce((sum, item) => sum + item.hours, 0);
        const projectHours = projects
          .filter(p => {
            const pStart = new Date(p.startDate + 'T00:00:00');
            const pEnd = new Date(p.endDate + 'T23:59:59');
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
      const utilization = totalCapacity > 0 ? ((totalCapacity - available) / totalCapacity) * 100 : 0;

      return {
        month: monthKey,
        nonProject: totalNonProject,
        project: totalProject,
        available,
        utilization: Math.round(utilization)
      };
    });
  };

  const monthlyCapacity = useMemo(() => calculateMonthlyCapacity(), [engineers, projects]);

  // Get capacity date range for filtering
  const getCapacityDateRange = () => {
      if (capacityDateRange === 'custom') {
        return {
          start: new Date(capacityCustomStart + 'T00:00:00'),
          end: new Date(capacityCustomEnd + 'T23:59:59'),
          label: `${capacityCustomStart} to ${capacityCustomEnd}`
        };
      }

      if (capacityDateRange === 'all') {
        return {
          start: new Date(`${yearOptions[0]}-01-01T00:00:00`),
          end: new Date(`${yearOptions[yearOptions.length - 1]}-12-31T23:59:59`),
          label: 'All Time'
        };
      }

      // Assume it's a year string
      const year = parseInt(capacityDateRange);
      return {
        start: new Date(`${year}-01-01T00:00:00`),
        end: new Date(`${year}-12-31T23:59:59`),
        label: `${year}`
      };
  };

  // Filter monthly capacity by date range
  const filteredMonthlyCapacity = useMemo(() => {
    const dateRange = getCapacityDateRange();
    return monthlyCapacity.filter(m => {
      const [year, month] = m.month.split('-').map(Number);
      const monthDate = new Date(year, month - 1, 1);
      return monthDate >= dateRange.start && monthDate <= dateRange.end;
    });
  }, [monthlyCapacity, capacityDateRange, capacityCustomStart, capacityCustomEnd]);

  // Individual capacity trends
  const individualCapacityTrends = useMemo(() => {
    const months = filteredMonthlyCapacity.map(m => m.month);
    
    return engineers.map(eng => ({
      name: eng.name,
      data: months.map(month => {
        const monthStart = new Date(month + '-01');
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        
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
        
        return {
          month,
          utilization: Math.round(utilization)
        };
      })
    }));
  }, [engineers, projects, filteredMonthlyCapacity]);

  // Prepare data for individual capacity line chart
  const individualCapacityChartData = useMemo(() => {
    const months = filteredMonthlyCapacity.map(m => m.month);
    
    return months.map(month => {
      const dataPoint = { month };
      
      individualCapacityTrends.forEach(trend => {
        const monthData = trend.data.find(d => d.month === month);
        dataPoint[trend.name] = monthData ? monthData.utilization : 0;
      });
      
      return dataPoint;
    });
  }, [individualCapacityTrends, filteredMonthlyCapacity]);

  // Monthly breakdown table
  const monthlyBreakdown = useMemo(() => {
    const months = filteredMonthlyCapacity.map(m => m.month);
    
    const breakdown = engineers.map(eng => {
      const monthData = months.map(month => {
        const monthStart = new Date(month + '-01');
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        
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
        const utilization = ((nonProject + projectHours) / eng.totalHours) * 100;
        
        return {
          month,
          project: projectHours,
          nonProject,
          available,
          utilization: Math.round(utilization)
        };
      });
      
      return {
        engineer: eng.name,
        months: monthData
      };
    });
    
    // Add team totals
    const teamTotals = months.map(month => {
      const monthData = breakdown.map(eng => 
        eng.months.find(m => m.month === month)
      );
      
      return {
        month,
        project: monthData.reduce((sum, m) => sum + m.project, 0),
        nonProject: monthData.reduce((sum, m) => sum + m.nonProject, 0),
        available: monthData.reduce((sum, m) => sum + m.available, 0),
        utilization: Math.round(
          (monthData.reduce((sum, m) => sum + m.project + m.nonProject, 0) / 
           (engineers.length * 40)) * 100
        )
      };
    });
    
    return { breakdown, teamTotals, months };
  }, [engineers, projects, filteredMonthlyCapacity]);

  // Gantt chart data
  const getGanttDateRange = () => {
    if (ganttDateRange === 'custom') {
      return {
        start: new Date(ganttCustomStart + 'T00:00:00'),
        end: new Date(ganttCustomEnd + 'T23:59:59'),
        label: `${ganttCustomStart} to ${ganttCustomEnd}`
      };
    }

    if (ganttDateRange === 'all') {
      return {
        start: new Date(`${yearOptions[0]}-01-01T00:00:00`),
        end: new Date(`${yearOptions[yearOptions.length - 1]}-12-31T23:59:59`),
        label: 'All Time'
      };
    }

    // Assume it's a year string
    const year = parseInt(ganttDateRange);
    return {
      start: new Date(`${year}-01-01T00:00:00`),
      end: new Date(`${year}-12-31T23:59:59`),
      label: `${year}`
    };
  };

  const ganttData = useMemo(() => {
    const dateRange = getGanttDateRange();
    const referenceDate = dateRange.start;
    const endDate = dateRange.end;

    // Generate month labels with their week positions
    const monthTicks = [];
    for (let d = new Date(referenceDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
      const weekPosition = Math.floor((d - referenceDate) / (7 * 24 * 60 * 60 * 1000));
      monthTicks.push({
        week: weekPosition,
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      });
    }

    // Generate week ticks (every week)
    const totalWeeks = Math.ceil((endDate - referenceDate) / (7 * 24 * 60 * 60 * 1000));
    const weekTicks = [];
    for (let w = 0; w <= totalWeeks; w++) {
      weekTicks.push(w);
    }

    // Filter projects that overlap with date range
    const filteredProjects = projects.filter(p => {
      if (ownerFilter !== 'all' && p.owner !== ownerFilter) return false;
      if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      const pStart = new Date(p.startDate);
      const pEnd = new Date(p.endDate);

      return pStart <= endDate && pEnd >= referenceDate;
    });

    const chartData = filteredProjects.map(project => {
      const startDate = new Date(project.startDate);
      const endDateProj = new Date(project.endDate);

      // Clip dates to the selected range
      const clippedStart = startDate < referenceDate ? referenceDate : startDate;
      const clippedEnd = endDateProj > dateRange.end ? dateRange.end : endDateProj;

      const startWeek = Math.floor((clippedStart - referenceDate) / (7 * 24 * 60 * 60 * 1000));
      const endWeek = Math.floor((clippedEnd - referenceDate) / (7 * 24 * 60 * 60 * 1000));
      const durationWeeks = endWeek - startWeek;

      // Calculate completed vs remaining within visible range
      const totalProjectWeeks = Math.floor((endDateProj - startDate) / (7 * 24 * 60 * 60 * 1000));
      const completedWeeks = Math.floor(totalProjectWeeks * (project.progress / 100));

      // How much of the completed portion falls in the visible range?
      const visibleCompletedWeeks = Math.min(
        completedWeeks,
        Math.max(0, completedWeeks - Math.floor((referenceDate - startDate) / (7 * 24 * 60 * 60 * 1000)))
      );

      const completedInRange = Math.min(visibleCompletedWeeks, durationWeeks);
      const remainingInRange = durationWeeks - completedInRange;

      return {
        name: project.name,
        owner: project.owner,
        status: project.status,
        start: startWeek,
        completed: completedInRange,
        remaining: remainingInRange,
        progress: project.progress,
        startDate: project.startDate,
        endDate: project.endDate
      };
    });

    // Calculate milestone positions
    const milestoneMarkers = [];
    filteredProjects.forEach(project => {
      project.milestones.forEach(milestone => {
        const milestoneDate = new Date(milestone.plannedDate);
        // Check if milestone is within the date range
        if (milestoneDate >= referenceDate && milestoneDate <= endDate) {
          const weekPosition = Math.floor((milestoneDate - referenceDate) / (7 * 24 * 60 * 60 * 1000));
          milestoneMarkers.push({
            name: project.name,
            week: weekPosition,
            milestoneName: milestone.name,
            plannedDate: milestone.plannedDate,
            actualDate: milestone.actualDate,
            status: milestone.status,
            projectName: project.name
          });
        }
      });
    });

    return {
      data: chartData,
      monthTicks,
      weekTicks,
      totalWeeks,
      milestoneMarkers,
      referenceDate,
      endDate: dateRange.end,
      label: dateRange.label
    };
  }, [projects, ganttDateRange, ganttCustomStart, ganttCustomEnd, ownerFilter, priorityFilter, statusFilter]);

  // Milestone data
  const getMilestoneDateRange = () => {
    if (milestoneDateRange === 'custom') {
      return {
        start: new Date(milestoneCustomStart + 'T00:00:00'),
        end: new Date(milestoneCustomEnd + 'T23:59:59'),
        label: `${milestoneCustomStart} to ${milestoneCustomEnd}`
      };
    }

    if (milestoneDateRange === 'all') {
      return {
        start: new Date(`${yearOptions[0]}-01-01T00:00:00`),
        end: new Date(`${yearOptions[yearOptions.length - 1]}-12-31T23:59:59`),
        label: 'All Time'
      };
    }

    // Assume it's a year string
    const year = parseInt(milestoneDateRange);
    return {
      start: new Date(`${year}-01-01T00:00:00`),
      end: new Date(`${year}-12-31T23:59:59`),
      label: `${year}`
    };
  };

  const milestoneData = useMemo(() => {
    const dateRange = getMilestoneDateRange();
    
    const allMilestones = projects
      .filter(p => {
        if (ownerFilter !== 'all' && p.owner !== ownerFilter) return false;
        if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        return true;
      })
      .flatMap(p => 
        p.milestones.map(m => ({
          ...m,
          projectName: p.name,
          projectId: p.id
        }))
      )
      .filter(m => {
        const mDate = new Date(m.plannedDate);
        return mDate >= dateRange.start && mDate <= dateRange.end;
      });

    const completed = allMilestones.filter(m => m.status === 'completed').length;
    const atRisk = allMilestones.filter(m => m.status === 'at-risk').length;
    const overdue = allMilestones.filter(m => {
      if (m.status === 'completed') return false;
      return new Date(m.plannedDate) < new Date();
    }).length;

    // Calculate cumulative data by month
    const months = [];
    for (let d = new Date(dateRange.start); d <= dateRange.end; d.setMonth(d.getMonth() + 1)) {
      months.push(d.toISOString().slice(0, 7));
    }

    const cumulativeData = months.map(month => {
      // Use string comparison to avoid timezone issues
      // month is "YYYY-MM", so we compare against "YYYY-MM-31" (will work for all months)
      const monthStr = month + '-31';

      const plannedByMonth = allMilestones.filter(m =>
        m.plannedDate <= monthStr
      ).length;

      const completedByMonth = allMilestones.filter(m =>
        m.actualDate && m.actualDate <= monthStr
      ).length;

      return {
        month,
        planned: plannedByMonth,
        actual: completedByMonth
      };
    });

    const variance = completed - (allMilestones.filter(m => 
      new Date(m.plannedDate) <= new Date()
    ).length);

    return {
      allMilestones,
      total: allMilestones.length,
      completed,
      atRisk,
      overdue,
      completionRate: allMilestones.length > 0 ? Math.round((completed / allMilestones.length) * 100) : 0,
      variance,
      cumulativeData,
      label: dateRange.label
    };
  }, [projects, milestoneDateRange, milestoneCustomStart, milestoneCustomEnd, ownerFilter, priorityFilter, statusFilter]);

  const handleCompleteMilestone = (projectId, milestoneId) => {
    const today = new Date().toISOString().split('T')[0];
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          milestones: p.milestones.map(m => 
            m.id === milestoneId 
              ? { ...m, actualDate: today, status: 'completed' }
              : m
          )
        };
      }
      return p;
    }));
  };

  const handleMarkAtRisk = (projectId, milestoneId) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          milestones: p.milestones.map(m => 
            m.id === milestoneId 
              ? { ...m, status: 'at-risk' }
              : m
          )
        };
      }
      return p;
    }));
  };

  // Filtered project count
  const filteredProjectCount = useMemo(() => {
    return projects.filter(p => {
      if (ownerFilter !== 'all' && p.owner !== ownerFilter) return false;
      if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      return true;
    }).length;
  }, [projects, ownerFilter, priorityFilter, statusFilter]);

  const hasActiveFilters = ownerFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all';

  // Render tabs
  const renderTabs = () => (
    <div className="flex space-x-4 border-b border-gray-200 mb-6">
      <button
        onClick={() => setActiveTab('projects')}
        className={`px-4 py-2 font-medium ${
          activeTab === 'projects'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Projects
      </button>
      <button
        onClick={() => setActiveTab('roadmap')}
        className={`px-4 py-2 font-medium ${
          activeTab === 'roadmap'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Roadmap
      </button>
      <button
        onClick={() => setActiveTab('milestones')}
        className={`px-4 py-2 font-medium ${
          activeTab === 'milestones'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Milestones
      </button>
      <button
        onClick={() => setActiveTab('resources')}
        className={`px-4 py-2 font-medium ${
          activeTab === 'resources'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Resources
      </button>
    </div>
  );

  // Render projects view
  const renderProjects = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Active Projects</h2>
        <button
          onClick={() => setShowAddProject(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>

      {projects.map(project => (
        <div key={project.id} className="bg-white rounded-lg shadow-md border border-gray-200">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleProject(project.id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-3 flex-1">
                {expandedProjects.has(project.id) ? (
                  <ChevronDown className="w-5 h-5 text-gray-400 mt-1" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{project.owner}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{project.startDate} to {project.endDate}</span>
                    </span>
                    <span className="font-medium">Priority: {project.priority}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditProject(project);
                }}
                className="ml-4 p-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>

          {expandedProjects.has(project.id) && (
            <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
              <div className="mt-4 space-y-3">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Budget & Spending:</h4>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="text-sm text-gray-600">Budget: <span className="font-semibold text-gray-800">${project.budget.toLocaleString()}</span></p>
                        <p className="text-sm text-gray-600">Spent: <span className="font-semibold text-gray-800">${project.spent.toLocaleString()}</span></p>
                        <p className="text-sm text-gray-600">Remaining: <span className={`font-semibold ${project.budget - project.spent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${(project.budget - project.spent).toLocaleString()}
                        </span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-800">{Math.round((project.spent / project.budget) * 100)}%</p>
                        <p className="text-xs text-gray-500">of budget</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          project.spent > project.budget * 1.1 ? 'bg-red-600' :
                            project.spent > project.budget ? 'bg-yellow-500' :
                            'bg-green-600'
                        }`}
                        style={{ width: `${Math.min((project.spent / project.budget) * 100, 100)}%` }}
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setManagingExpenses(project);
                      }}
                      className="mt-2 w-full px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                    >
                      Manage Expenses
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Latest Update:</h4>
                  <p className="text-gray-600">{project.notes}</p>
                </div>
                {project.changeHistory && project.changeHistory.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Change History:</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {project.changeHistory
                        .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
                        .map((change, idx) => (
                          <div key={idx} className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-gray-700">{change.field} changed:</span>
                              <span className="text-gray-500">{new Date(change.changedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="mt-1 text-gray-600">
                              <span className="line-through">{change.oldValue}</span>
                              <span className="mx-1">→</span>
                              <span className="font-medium text-gray-800">{change.newValue}</span>
                            </div>
                            <div className="text-gray-500 mt-1">by {change.changedBy}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-700">Team Assignments:</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setManagingTasks(project);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Manage Assignments
                    </button>
                  </div>
                  {project.tasks.length > 0 ? (
                    <div className="space-y-1">
                      {project.tasks.map((task, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">{task.engineer}</span>
                          <span className="font-medium text-gray-800">{task.hoursPerWeek} hrs/week</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No team members assigned yet</p>
                  )}
                </div>
                {project.milestones.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-700">Milestones:</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setManagingMilestones(project);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Manage Milestones
                      </button>
                    </div>
                    <div className="space-y-1">
                      {project.milestones.map(milestone => (
                        <div key={milestone.id} className="flex items-center space-x-2 text-sm">
                          {milestone.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : milestone.status === 'at-risk' ? (
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-gray-700">{milestone.name}</span>
                          <span className="text-gray-500">({milestone.plannedDate})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {project.milestones.length === 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-700">Milestones:</h4>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setManagingMilestones(project);
                      }}
                      className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Add Milestones
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Project</h3>
              <button onClick={() => setEditingProject(null)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                  <select
                    value={editingProject.owner}
                    onChange={(e) => setEditingProject({...editingProject, owner: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {engineers.map(eng => (
                      <option key={eng.name} value={eng.name}>{eng.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={editingProject.priority}
                    onChange={(e) => setEditingProject({...editingProject, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingProject.status}
                    onChange={(e) => setEditingProject({...editingProject, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                     <option value="On Track">On Track</option>
                      <option value="At Risk">At Risk</option>
                      <option value="Behind">Behind</option>
                      <option value="Planned">Planned</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Progress %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingProject.progress}
                    onChange={(e) => setEditingProject({...editingProject, progress: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editingProject.startDate}
                    onChange={(e) => setEditingProject({...editingProject, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editingProject.endDate}
                    onChange={(e) => setEditingProject({...editingProject, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours/Week</label>
                <input
                  type="number"
                  value={editingProject.estimatedHoursPerWeek}
                  onChange={(e) => setEditingProject({...editingProject, estimatedHoursPerWeek: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={editingProject.budget}
                    onChange={(e) => setEditingProject({...editingProject, budget: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spent ($)</label>
                  <input
                    type="number"
                    value={editingProject.spent}
                    onChange={(e) => setEditingProject({...editingProject, spent: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editingProject.notes}
                  onChange={(e) => setEditingProject({...editingProject, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-between pt-4">
                  <button
                    onClick={() => handleDeleteProject(editingProject.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete Project
                  </button>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setEditingProject(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                <button
                  onClick={handleSaveProject}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                   Save Changes
                  </button>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add New Project</h3>
              <button onClick={() => setShowAddProject(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              This will create a new project that you can customize with details, team assignments, and milestones.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddProject(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProject}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Expenses Modal */}
      {managingExpenses && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">Manage Expenses</h3>
                <p className="text-sm text-gray-600">{managingExpenses.name}</p>
              </div>
              <button onClick={() => setManagingExpenses(null)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Budget Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Budget</p>
                  <p className="text-xl font-bold text-gray-800">${managingExpenses.budget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Spent</p>
                  <p className="text-xl font-bold text-gray-800">${managingExpenses.spent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className={`text-xl font-bold ${managingExpenses.budget - managingExpenses.spent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${(managingExpenses.budget - managingExpenses.spent).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">% Used</p>
                  <p className="text-xl font-bold text-gray-800">{Math.round((managingExpenses.spent / managingExpenses.budget) * 100)}%</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    managingExpenses.spent > managingExpenses.budget * 1.1 ? 'bg-red-600' :
                    managingExpenses.spent > managingExpenses.budget ? 'bg-yellow-500' :
                    'bg-green-600'
                  }`}
                  style={{ width: `${Math.min((managingExpenses.spent / managingExpenses.budget) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Add Expense Form */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-800 mb-3">Add New Expense</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    id="newExpenseDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    id="newExpenseAmount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    id="newExpenseCategory"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Equipment">Equipment</option>
                    <option value="Labor">Labor</option>
                    <option value="Services">Services</option>
                    <option value="Software">Software</option>
                    <option value="Materials">Materials</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    id="newExpenseDescription"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Brief description"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  const date = document.getElementById('newExpenseDate').value;
                  const amount = parseFloat(document.getElementById('newExpenseAmount').value) || 0;
                  const category = document.getElementById('newExpenseCategory').value;
                  const description = document.getElementById('newExpenseDescription').value;

                  if (amount > 0 && description) {
                    const newExpense = {
                      id: Math.max(0, ...managingExpenses.expenses.map(e => e.id)) + 1,
                      date,
                      amount,
                      category,
                      description
                    };

                    const updatedProject = {
                      ...managingExpenses,
                      expenses: [...managingExpenses.expenses, newExpense],
                      spent: managingExpenses.spent + amount
                    };

                    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                    setManagingExpenses(updatedProject);

                    // Clear form
                    document.getElementById('newExpenseAmount').value = '';
                    document.getElementById('newExpenseDescription').value = '';
                  }
                }}
                className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Expense
              </button>
            </div>

            {/* Expenses List */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Expense History</h4>
              {managingExpenses.expenses.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No expenses recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {managingExpenses.expenses
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(expense => (
                      <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                              {expense.category}
                            </span>
                            <span className="font-medium text-gray-800">{expense.description}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{expense.date}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold text-gray-800">
                            ${expense.amount.toLocaleString()}
                          </span>
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this expense?')) {
                                const updatedProject = {
                                  ...managingExpenses,
                                  expenses: managingExpenses.expenses.filter(e => e.id !== expense.id),
                                  spent: managingExpenses.spent - expense.amount
                                };
                                setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                                setManagingExpenses(updatedProject);
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 mt-6 border-t">
              <button
                onClick={() => setManagingExpenses(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Milestones Modal */}
      {managingMilestones && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">Manage Milestones</h3>
                <p className="text-sm text-gray-600">{managingMilestones.name}</p>
              </div>
              <button onClick={() => setManagingMilestones(null)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Add Milestone Form */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-800 mb-3">Add New Milestone</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Name</label>
                  <input
                    type="text"
                    id="newMilestoneName"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Equipment Procurement Complete"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planned Date</label>
                  <input
                    type="date"
                    id="newMilestonePlannedDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    id="newMilestoneStatus"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="pending">Pending</option>
                    <option value="at-risk">At Risk</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => {
                  const name = document.getElementById('newMilestoneName').value;
                  const plannedDate = document.getElementById('newMilestonePlannedDate').value;
                  const status = document.getElementById('newMilestoneStatus').value;

                  if (name && plannedDate) {
                    const newMilestone = {
                      id: Math.max(0, ...managingMilestones.milestones.map(m => m.id)) + 1,
                      name,
                      plannedDate,
                      actualDate: status === 'completed' ? new Date().toISOString().split('T')[0] : null,
                      status
                    };

                    const updatedProject = {
                      ...managingMilestones,
                      milestones: [...managingMilestones.milestones, newMilestone]
                    };

                    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                    setManagingMilestones(updatedProject);

                    // Clear form
                    document.getElementById('newMilestoneName').value = '';
                    document.getElementById('newMilestonePlannedDate').value = '';
                    document.getElementById('newMilestoneStatus').value = 'pending';
                  }
                }}
                className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Milestone
              </button>
            </div>

            {/* Milestones List */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Project Milestones</h4>
              {managingMilestones.milestones.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No milestones added yet</p>
              ) : (
                <div className="space-y-2">
                  {managingMilestones.milestones
                    .sort((a, b) => new Date(a.plannedDate) - new Date(b.plannedDate))
                    .map(milestone => {
                      const isOverdue = !milestone.actualDate && new Date(milestone.plannedDate) < new Date();
                      const isEditing = editingMilestone?.id === milestone.id;
                      
                      return (
                        <div 
                          key={milestone.id} 
                          className={`p-3 rounded-lg border ${
                            milestone.status === 'completed' ? 'bg-green-50 border-green-200' :
                            milestone.status === 'at-risk' || isOverdue ? 'bg-yellow-50 border-yellow-200' :
                            'bg-gray-50 border-gray-200'
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingMilestone.name}
                                onChange={(e) => setEditingMilestone({...editingMilestone, name: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Milestone name"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="date"
                                  value={editingMilestone.plannedDate}
                                  onChange={(e) => setEditingMilestone({...editingMilestone, plannedDate: e.target.value})}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <select
                                  value={editingMilestone.status}
                                  onChange={(e) => setEditingMilestone({...editingMilestone, status: e.target.value})}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="at-risk">At Risk</option>
                                  <option value="completed">Completed</option>
                                </select>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    const updatedProject = {
                                      ...managingMilestones,
                                      milestones: managingMilestones.milestones.map(m =>
                                        m.id === editingMilestone.id ? editingMilestone : m
                                      )
                                    };
                                    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                                    setManagingMilestones(updatedProject);
                                    setEditingMilestone(null);
                                  }}
                                  className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingMilestone(null)}
                                  className="flex-1 px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  {milestone.status === 'completed' ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  ) : milestone.status === 'at-risk' || isOverdue ? (
                                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                                  ) : (
                                    <Clock className="w-5 h-5 text-gray-400" />
                                  )}
                                  <span className="font-medium text-gray-800">{milestone.name}</span>
                                </div>
                                <div className="mt-1 ml-7 text-sm text-gray-600">
                                  <span>Planned: {milestone.plannedDate}</span>
                                  {milestone.actualDate && (
                                    <span className="ml-3">• Completed: {milestone.actualDate}</span>
                                  )}
                                  {isOverdue && !milestone.actualDate && (
                                    <span className="ml-3 text-red-600 font-medium">• OVERDUE</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {milestone.status !== 'completed' && (
                                  <>
                                    {milestone.status !== 'at-risk' && (
                                      <button
                                        onClick={() => {
                                          const updatedProject = {
                                            ...managingMilestones,
                                            milestones: managingMilestones.milestones.map(m =>
                                              m.id === milestone.id ? { ...m, status: 'at-risk' } : m
                                            )
                                          };
                                          setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                                          setManagingMilestones(updatedProject);
                                        }}
                                        className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                                      >
                                        Mark At Risk
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        const today = new Date().toISOString().split('T')[0];
                                        const updatedProject = {
                                          ...managingMilestones,
                                          milestones: managingMilestones.milestones.map(m =>
                                            m.id === milestone.id ? { ...m, status: 'completed', actualDate: today } : m
                                          )
                                        };
                                        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                                        setManagingMilestones(updatedProject);
                                      }}
                                      className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                                    >
                                      Complete
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => setEditingMilestone({...milestone})}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit milestone"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Delete this milestone?')) {
                                      const updatedProject = {
                                        ...managingMilestones,
                                        milestones: managingMilestones.milestones.filter(m => m.id !== milestone.id)
                                      };
                                      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                                      setManagingMilestones(updatedProject);
                                    }
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete milestone"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 mt-6 border-t">
              <button
                onClick={() => setManagingMilestones(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Team Assignments Modal */}
      {managingTasks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">Manage Team Assignments</h3>
                <p className="text-sm text-gray-600">{managingTasks.name}</p>
              </div>
              <button onClick={() => setManagingTasks(null)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Add Assignment Form */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-800 mb-3">Add Team Member</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Engineer</label>
                  <select
                    id="newTaskEngineer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {engineers.map(eng => (
                      <option key={eng.name} value={eng.name}>{eng.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours per Week</label>
                  <input
                    type="number"
                    id="newTaskHours"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0"
                    min="0"
                    max="40"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  const engineer = document.getElementById('newTaskEngineer').value;
                  const hoursPerWeek = parseInt(document.getElementById('newTaskHours').value) || 0;

                  if (hoursPerWeek > 0) {
                    // Check if engineer already assigned
                    const existingTask = managingTasks.tasks.find(t => t.engineer === engineer);
                    
                    if (existingTask) {
                      alert(`${engineer} is already assigned to this project. Edit their hours below or remove them first.`);
                      return;
                    }

                    const newTask = {
                      engineer,
                      hoursPerWeek
                    };

                    const updatedProject = {
                      ...managingTasks,
                      tasks: [...managingTasks.tasks, newTask]
                    };

                    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                    setManagingTasks(updatedProject);

                    // Clear form
                    document.getElementById('newTaskHours').value = '';
                  }
                }}
                className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Assignment
              </button>
            </div>

            {/* Current Assignments */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Current Assignments</h4>
              {managingTasks.tasks.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No team members assigned yet</p>
              ) : (
                <div className="space-y-2">
                  {managingTasks.tasks.map((task, idx) => {
                    const eng = engineers.find(e => e.name === task.engineer);
                    const engCapacity = capacityData.find(c => c.name === task.engineer);
                    
                    return (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{task.engineer}</p>
                            <p className="text-xs text-gray-500">{eng?.role}</p>
                          </div>
                          <div className="text-right mr-3">
                            <p className="text-lg font-bold text-gray-800">{task.hoursPerWeek} hrs/week</p>
                            {engCapacity && (
                              <p className="text-xs text-gray-500">
                                {Math.round((task.hoursPerWeek / eng.totalHours) * 100)}% of capacity
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              if (window.confirm(`Remove ${task.engineer} from this project?`)) {
                                const updatedProject = {
                                  ...managingTasks,
                                  tasks: managingTasks.tasks.filter((t, i) => i !== idx)
                                };
                                setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                                setManagingTasks(updatedProject);
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            defaultValue={task.hoursPerWeek}
                            min="0"
                            max="40"
                            className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded"
                            id={`editHours-${idx}`}
                          />
                          <button
                            onClick={() => {
                              const newHours = parseInt(document.getElementById(`editHours-${idx}`).value) || 0;
                              
                              if (newHours > 0) {
                                const updatedProject = {
                                  ...managingTasks,
                                  tasks: managingTasks.tasks.map((t, i) => 
                                    i === idx ? { ...t, hoursPerWeek: newHours } : t
                                  )
                                };
                                setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                                setManagingTasks(updatedProject);
                              }
                            }}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Team Summary */}
            {managingTasks.tasks.length > 0 && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Project Resource Summary</h4>
                <div className="text-sm text-gray-600">
                  <p>Total Hours: <span className="font-semibold text-gray-800">
                    {managingTasks.tasks.reduce((sum, t) => sum + t.hoursPerWeek, 0)} hrs/week
                  </span></p>
                  <p className="mt-1">Team Members: <span className="font-semibold text-gray-800">
                    {managingTasks.tasks.length}
                  </span></p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 mt-6 border-t">
              <button
                onClick={() => setManagingTasks(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render roadmap view
  const renderRoadmap = () => {
    const uniqueOwners = [...new Set(projects.map(p => p.owner))];
    const priorities = ['Critical', 'High', 'Medium', 'Low'];
    const statuses = ['On Track', 'At Risk', 'Behind', 'Planned', 'Completed', 'Cancelled'];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Project Roadmap</h2>
          <button
            onClick={() => setShowAddProject(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Planned Project</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Filters:</span>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setOwnerFilter('all');
                  setPriorityFilter('all');
                  setStatusFilter('all');
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear Filters
              </button>
            )}
            <span className="text-sm text-gray-600">
              Showing {filteredProjectCount} of {projects.length} projects
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Owners</option>
                {uniqueOwners.map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Priorities</option>
                {priorities.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <input
              type="checkbox"
              id="showMilestones"
              checked={showMilestones}
              onChange={(e) => setShowMilestones(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="showMilestones" className="text-sm font-medium text-gray-700">
              Show Milestones
            </label>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center space-x-4 mb-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Timeline:</span>
          </div>
          <div className="flex items-center space-x-2">
          {yearOptions.map(year => (
                <button
                  key={year}
                  onClick={() => setGanttDateRange(String(year))}
                  className={`px-3 py-1 rounded ${ganttDateRange === String(year) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {year}
                </button>
              ))}
            <button
              onClick={() => setGanttDateRange('all')}
              className={`px-3 py-1 rounded ${ganttDateRange === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              All Time
            </button>
            <button
              onClick={() => setGanttDateRange('custom')}
              className={`px-3 py-1 rounded ${ganttDateRange === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Custom
            </button>
          </div>
          {ganttDateRange === 'custom' && (
            <div className="mt-3 flex items-center space-x-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={ganttCustomStart}
                  onChange={(e) => setGanttCustomStart(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={ganttCustomEnd}
                  onChange={(e) => setGanttCustomEnd(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded"
                />
              </div>
            </div>
          )}
        </div>

        {/* Gantt Chart */}
        <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Project Timeline - {ganttData.label}
              {hasActiveFilters && <span className="text-sm text-gray-500 ml-2">(Filtered)</span>}
            </h3>

            {/* Milestone Legend */}
            {showMilestones && ganttData.milestoneMarkers.length > 0 && (
              <div className="flex items-center space-x-4 mb-4 text-sm">
                <span className="text-gray-600">Milestones:</span>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rotate-45"></div>
                  <span className="text-gray-600">Completed</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-500 rotate-45"></div>
                  <span className="text-gray-600">At Risk</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rotate-45"></div>
                  <span className="text-gray-600">Pending</span>
                </div>
              </div>
            )}

            <ResponsiveContainer width="100%" height={Math.max(350, ganttData.data.length * 50 + 50)}>
              <ComposedChart
                data={ganttData.data}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 150, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  domain={[0, ganttData.totalWeeks]}
                  ticks={ganttData.monthTicks.map(m => m.week)}
                  tickFormatter={(week) => {
                    const monthTick = ganttData.monthTicks.find(m => m.week === week);
                    return monthTick ? monthTick.label : '';
                  }}
                  axisLine={{ stroke: '#374151' }}
                  tickLine={{ stroke: '#374151' }}
                  tick={{ fontSize: 11, fill: '#374151' }}
                  interval={0}
                />
                <XAxis
                  xAxisId="weeks"
                  type="number"
                  domain={[0, ganttData.totalWeeks]}
                  ticks={ganttData.weekTicks.filter((_, i) => i % 4 === 0)}
                  tickFormatter={(week) => `W${week}`}
                  orientation="top"
                  axisLine={false}
                  tickLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                  tick={{ fontSize: 9, fill: '#9ca3af' }}
                  interval={0}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                          <p className="font-semibold">{data.name}</p>
                          <p className="text-sm text-gray-600">Owner: {data.owner}</p>
                          <p className="text-sm text-gray-600">Status: {data.status}</p>
                          <p className="text-sm text-gray-600">Progress: {data.progress}%</p>
                          <p className="text-sm text-gray-600">{data.startDate} to {data.endDate}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="start" stackId="a" fill="transparent" />
                <Bar dataKey="completed" stackId="a">
                  {ganttData.data.map((entry, index) => (
                    <Cell key={`cell-completed-${index}`} fill={getStatusBarColor(entry.status)} opacity={0.8} />
                  ))}
                </Bar>
                <Bar
                  dataKey="remaining"
                  stackId="a"
                  shape={(props) => {
                    const { x, y, width, height, payload } = props;
                    const projectMilestones = ganttData.milestoneMarkers.filter(m => m.name === payload.name);

                    // Calculate pixels per week based on the bar dimensions
                    // x is positioned at (start + completed) weeks into the chart
                    // width represents 'remaining' weeks
                    let pixelsPerWeek = 0;
                    if (payload.remaining > 0) {
                      pixelsPerWeek = width / payload.remaining;
                    } else if (payload.completed > 0) {
                      // If no remaining, try to get scale from another source
                      // Fall back to estimating from chart width
                      pixelsPerWeek = width || 10;
                    }

                    // If we still don't have a scale, calculate from total
                    if (pixelsPerWeek === 0 && ganttData.totalWeeks > 0) {
                      // Estimate based on typical chart width
                      pixelsPerWeek = 800 / ganttData.totalWeeks;
                    }

                    // x is at week position (start + completed)
                    // To find week 0 position: x - (start + completed) * pixelsPerWeek
                    const week0X = x - (payload.start + payload.completed) * pixelsPerWeek;

                    return (
                      <g>
                        {/* The remaining bar */}
                        <rect
                          x={x}
                          y={y}
                          width={Math.max(0, width)}
                          height={height}
                          fill={getStatusBarColor(payload.status)}
                          opacity={0.3}
                        />
                        {/* Milestone markers */}
                        {showMilestones && projectMilestones.map((milestone, idx) => {
                          const milestoneX = week0X + (milestone.week * pixelsPerWeek);
                          const milestoneY = y + height / 2;
                          const color = milestone.status === 'completed' ? '#10b981' :
                                        milestone.status === 'at-risk' ? '#f59e0b' : '#3b82f6';
                          return (
                            <g key={idx}>
                              <rect
                                x={milestoneX - 5}
                                y={milestoneY - 5}
                                width={10}
                                height={10}
                                fill={color}
                                transform={`rotate(45, ${milestoneX}, ${milestoneY})`}
                                stroke="#fff"
                                strokeWidth={1.5}
                                style={{ cursor: 'pointer' }}
                              />
                              <title>{`${milestone.milestoneName}\nPlanned: ${milestone.plannedDate}\nStatus: ${milestone.status}`}</title>
                            </g>
                          );
                        })}
                      </g>
                    );
                  }}
                >
                  {ganttData.data.map((entry, index) => (
                    <Cell key={`cell-remaining-${index}`} fill={getStatusBarColor(entry.status)} opacity={0.3} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

        {/* Capacity Forecast */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Team Capacity Forecast
            {hasActiveFilters && <span className="text-sm text-gray-500 ml-2">(Based on Filtered Projects)</span>}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyCapacity.filter(m => {
                const year = parseInt(m.month.slice(0, 4));
                const currentYear = new Date().getFullYear();
                return year >= currentYear && year <= currentYear + 1;
              })}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
              />
              <YAxis label={{ value: 'Hours/Week', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                        <p className="font-semibold">{data.month}</p>
                        <p className="text-sm text-gray-600">Project Work: {data.project}h</p>
                        <p className="text-sm text-gray-600">Non-Project: {data.nonProject}h</p>
                        <p className="text-sm text-gray-600">Available: {data.available}h</p>
                        <p className="text-sm font-medium">Utilization: {data.utilization}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="nonProject" stackId="a" fill="#94a3b8" name="Non-Project Time" />
              <Bar dataKey="project" stackId="a" fill="#3b82f6" name="Project Work" />
              <Bar dataKey="available" stackId="a" fill="#10b981" name="Available" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Projects & Resource Impact */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Projects & Resource Impact</h3>
          <div className="space-y-3">
            {projects
              .filter(p => {
                if (ownerFilter !== 'all' && p.owner !== ownerFilter) return false;
                if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;
                if (statusFilter !== 'all' && p.status !== statusFilter) return false;
                return true;
              })
              .map(project => {
                const totalHours = project.tasks.reduce((sum, t) => sum + t.hoursPerWeek, 0);
                const ownerTask = project.tasks.find(t => t.engineer === project.owner);
                const ownerCapacity = engineers.find(e => e.name === project.owner)?.totalHours || 40;
                const ownerPct = ownerTask ? Math.round((ownerTask.hoursPerWeek / ownerCapacity) * 100) : 0;
                
                return (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-800">{project.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {totalHours} hours/week total
                          {ownerTask && ` • ${ownerTask.hoursPerWeek}h from ${project.owner} (${ownerPct}% of capacity)`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {project.startDate} to {project.endDate}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };

  // Render milestones view
  const renderMilestones = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Milestone Tracking</h2>

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center space-x-4 mb-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Date Range:</span>
          </div>
          <div className="flex items-center space-x-2">
          {yearOptions.map(year => (
                <button
                  key={year}
                  onClick={() => setMilestoneDateRange(String(year))}
                  className={`px-3 py-1 rounded ${milestoneDateRange === String(year) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {year}
                </button>
              ))}
            <button
              onClick={() => setMilestoneDateRange('all')}
              className={`px-3 py-1 rounded ${milestoneDateRange === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              All Time
            </button>
            <button
              onClick={() => setMilestoneDateRange('custom')}
              className={`px-3 py-1 rounded ${milestoneDateRange === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Custom
            </button>
          </div>
          {milestoneDateRange === 'custom' && (
            <div className="mt-3 flex items-center space-x-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={milestoneCustomStart}
                  onChange={(e) => setMilestoneCustomStart(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={milestoneCustomEnd}
                  onChange={(e) => setMilestoneCustomEnd(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded"
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Milestones</p>
                <p className="text-sm text-gray-500">{milestoneData.label}</p>
                {hasActiveFilters && <p className="text-xs text-gray-400">(filtered)</p>}
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800 mt-2">{milestoneData.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-sm text-gray-500">{milestoneData.label}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {milestoneData.completed}
              <span className="text-sm text-gray-500 ml-2">({milestoneData.completionRate}%)</span>
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">At Risk</p>
                <p className="text-sm text-gray-500">{milestoneData.label}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800 mt-2">{milestoneData.atRisk}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Variance</p>
                <p className="text-sm text-gray-500">{milestoneData.label}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <p className={`text-3xl font-bold mt-2 ${milestoneData.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {milestoneData.variance >= 0 ? '+' : ''}{milestoneData.variance}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {milestoneData.variance >= 0 ? 'Ahead of schedule' : 'Behind schedule'}
            </p>
          </div>
        </div>

        {/* Cumulative Chart */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Planned vs. Actual Completion - {milestoneData.label}
            {hasActiveFilters && <span className="text-sm text-gray-500 ml-2">(Filtered)</span>}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={milestoneData.cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
              />
              <YAxis label={{ value: 'Cumulative Milestones', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="planned" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Planned (Cumulative)"
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Actual (Cumulative)"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 mt-2">
            {milestoneData.variance >= 0 
              ? `You're ${milestoneData.variance} milestone${milestoneData.variance !== 1 ? 's' : ''} ahead of schedule. Great progress!`
              : `You're ${Math.abs(milestoneData.variance)} milestone${Math.abs(milestoneData.variance) !== 1 ? 's' : ''} behind schedule. Time to catch up.`
            }
          </p>
        </div>

        {/* Milestone List */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              All Milestones
              {hasActiveFilters && (
                <span className="text-sm text-gray-500 ml-2">
                  (Showing {milestoneData.allMilestones.length} of {projects.flatMap(p => p.milestones).length} milestones)
                </span>
              )}
            </h3>
          </div>
          <div className="space-y-2">
            {milestoneData.allMilestones.map(milestone => {
              const isOverdue = !milestone.actualDate && new Date(milestone.plannedDate) < new Date();
              
              return (
                <div 
                  key={`${milestone.projectId}-${milestone.id}`}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    milestone.status === 'completed' ? 'bg-green-50 border-green-200' :
                    milestone.status === 'at-risk' || isOverdue ? 'bg-yellow-50 border-yellow-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {milestone.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : milestone.status === 'at-risk' || isOverdue ? (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{milestone.name}</p>
                      <p className="text-sm text-gray-600">
                        {milestone.projectName} • Planned: {milestone.plannedDate}
                        {milestone.actualDate && ` • Completed: ${milestone.actualDate}`}
                        {isOverdue && !milestone.actualDate && ' • OVERDUE'}
                      </p>
                    </div>
                  </div>
                  {milestone.status !== 'completed' && (
                    <div className="flex space-x-2">
                      {milestone.status !== 'at-risk' && (
                        <button
                          onClick={() => handleMarkAtRisk(milestone.projectId, milestone.id)}
                          className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                        >
                          Mark At Risk
                        </button>
                      )}
                      <button
                        onClick={() => handleCompleteMilestone(milestone.projectId, milestone.id)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200"
                      >
                        Complete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render resources view
  const renderResources = () => {
    const totalCapacity = engineers.reduce((sum, e) => e.totalHours, 0);
    const totalAvailable = capacityData.reduce((sum, e) => sum + e.available, 0);
    const avgUtilization = Math.round(
      capacityData.reduce((sum, e) => sum + e.utilization, 0) / capacityData.length
    );
    const overloadedCount = capacityData.filter(e => e.utilization > 100).length;

    const engineerColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Team Resource Capacity</h2>
          <button
            onClick={() => setManagingEngineers(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Users className="w-4 h-4" />
            <span>Manage Team</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Team Capacity</p>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800 mt-2">{totalCapacity}h</p>
            <p className="text-sm text-gray-500 mt-1">{totalAvailable}h available</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Avg Utilization</p>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800 mt-2">{avgUtilization}%</p>
            <p className="text-sm text-gray-500 mt-1">Across team</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Overloaded</p>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800 mt-2">{overloadedCount}</p>
            <p className="text-sm text-gray-500 mt-1">Engineer{overloadedCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Date Range Selector for Capacity Charts */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center space-x-4 mb-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Capacity Timeline:</span>
          </div>
          <div className="flex items-center space-x-2">
          {yearOptions.map(year => (
                <button
                  key={year}
                  onClick={() => setCapacityDateRange(String(year))}
                  className={`px-3 py-1 rounded ${capacityDateRange === String(year) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {year}
                </button>
              ))}
            <button
              onClick={() => setCapacityDateRange('all')}
              className={`px-3 py-1 rounded ${capacityDateRange === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              All Time
            </button>
            <button
              onClick={() => setCapacityDateRange('custom')}
              className={`px-3 py-1 rounded ${capacityDateRange === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Custom
            </button>
          </div>
          {capacityDateRange === 'custom' && (
            <div className="mt-3 flex items-center space-x-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={capacityCustomStart}
                  onChange={(e) => setCapacityCustomStart(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={capacityCustomEnd}
                  onChange={(e) => setCapacityCustomEnd(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded"
                />
              </div>
            </div>
          )}
        </div>

        {/* Current Week Capacity Chart */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Week Capacity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={capacityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Hours/Week', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="nonProjectTotal" fill="#94a3b8" name="Non-Project Time" />
              <Bar dataKey="projectHours" fill="#3b82f6" name="Project Work" />
              <Bar dataKey="available" fill="#10b981" name="Available" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Team Capacity Over Time */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Team Capacity Allocation Over Time - {getCapacityDateRange().label}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredMonthlyCapacity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
              />
              <YAxis label={{ value: 'Hours/Week', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                        <p className="font-semibold">{data.month}</p>
                        <p className="text-sm text-gray-600">Non-Project: {data.nonProject}h</p>
                        <p className="text-sm text-gray-600">Project Work: {data.project}h</p>
                        <p className="text-sm text-gray-600">Available: {data.available}h</p>
                        <p className="text-sm font-medium">Utilization: {data.utilization}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="nonProject" stackId="a" fill="#94a3b8" name="Non-Project Time" />
              <Bar dataKey="project" stackId="a" fill="#3b82f6" name="Project Work" />
              <Bar dataKey="available" stackId="a" fill="#10b981" name="Available" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Individual Capacity Trends */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Individual Capacity Utilization Trends - {getCapacityDateRange().label}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={individualCapacityChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }}
                domain={[0, 120]}
              />
              <Tooltip />
              <Legend />
              {engineers.map((eng, idx) => (
                <Line 
                  key={eng.name}
                  type="monotone" 
                  dataKey={eng.name} 
                  stroke={engineerColors[idx % engineerColors.length]} 
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Monthly Breakdown by Engineer - {getCapacityDateRange().label}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left p-2 font-semibold">Engineer</th>
                  {monthlyBreakdown.months.map(month => (
                    <th key={month} className="text-center p-2 font-semibold whitespace-nowrap">
                      {month}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.breakdown.map(eng => (
                  <tr key={eng.engineer} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-2 font-medium text-gray-800 whitespace-nowrap">{eng.engineer}</td>
                    {eng.months.map(m => (
                      <td key={m.month} className="p-2 text-center">
                        <div className="text-xs">
                          <div className="text-gray-600">P:{m.project}</div>
                          <div className="text-gray-600">NP:{m.nonProject}</div>
                          <div className="text-gray-600">A:{m.available}</div>
                          <div className={`font-semibold mt-1 ${
                            m.utilization > 100 ? 'text-red-600' :
                            m.utilization > 85 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {m.utilization}%
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-400 bg-gray-100 font-semibold">
                  <td className="p-2">TEAM TOTAL</td>
                  {monthlyBreakdown.teamTotals.map(m => (
                    <td key={m.month} className="p-2 text-center">
                      <div className="text-xs">
                        <div className="text-gray-700">P:{m.project}</div>
                        <div className="text-gray-700">NP:{m.nonProject}</div>
                        <div className="text-gray-700">A:{m.available}</div>
                        <div className={`font-bold mt-1 ${
                          m.utilization > 100 ? 'text-red-600' :
                          m.utilization > 85 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {m.utilization}%
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            P = Project hours, NP = Non-Project hours, A = Available hours
          </p>
        </div>

        {/* Individual Engineer Cards */}
        <div className="grid grid-cols-2 gap-4">
          {capacityData.map(eng => {
            const utilizationColor = 
              eng.utilization > 100 ? 'text-red-600' :
              eng.utilization > 85 ? 'text-yellow-600' :
              'text-green-600';

            return (
              <div key={eng.name} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">{eng.name}</h4>
                    <p className="text-sm text-gray-600">{eng.role}</p>
                  </div>
                  <div className={`text-2xl font-bold ${utilizationColor}`}>
                    {Math.round(eng.utilization)}%
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Capacity:</span>
                    <span className="font-medium">{eng.totalHours}h/week</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Non-Project Time:</span>
                    <span className="font-medium">{eng.nonProjectTotal}h/week</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Project Work:</span>
                    <span className="font-medium">{eng.projectHours}h/week</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Available:</span>
                    <span className={`font-bold ${utilizationColor}`}>
                      {eng.available}h/week
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEditingEngineer(eng)}
                  className="mt-3 w-full px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Manage Non-Project Time
                </button>
              </div>
            );
          })}
        </div>

        {/* Edit Engineer Modal */}
        {editingEngineer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Manage Non-Project Time</h3>
                <button onClick={() => setEditingEngineer(null)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="mb-4">
                <p className="font-medium text-gray-800">{editingEngineer.name}</p>
                <p className="text-sm text-gray-600">{editingEngineer.role}</p>
              </div>
              <div className="space-y-3">
                  {editingEngineer.nonProjectTime.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={item.type}
                        onChange={(e) => {
                          const newNonProjectTime = editingEngineer.nonProjectTime.map((npt, i) =>
                            i === idx ? { ...npt, type: e.target.value } : npt
                          );
                          setEditingEngineer({ ...editingEngineer, nonProjectTime: newNonProjectTime });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded"
                        placeholder="Type (e.g., Line Support)"
                      />
                      <input
                        type="number"
                        value={item.hours}
                        onChange={(e) => {
                          const newNonProjectTime = editingEngineer.nonProjectTime.map((npt, i) =>
                            i === idx ? { ...npt, hours: parseInt(e.target.value) || 0 } : npt
                          );
                          setEditingEngineer({ ...editingEngineer, nonProjectTime: newNonProjectTime });
                        }}
                        className="w-20 px-3 py-2 border border-gray-300 rounded"
                        placeholder="Hours"
                      />
                      <button
                        onClick={() => {
                          const newNonProjectTime = editingEngineer.nonProjectTime.filter((_, i) => i !== idx);
                          setEditingEngineer({ ...editingEngineer, nonProjectTime: newNonProjectTime });
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newNonProjectTime = [...editingEngineer.nonProjectTime, { type: "", hours: 0 }];
                      setEditingEngineer({ ...editingEngineer, nonProjectTime: newNonProjectTime });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                  >
                    + Add Non-Project Time
                  </button>
                </div>
              <div className="flex justify-end space-x-3 pt-4 mt-4 border-t">
                <button
                  onClick={() => setEditingEngineer(null)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setEngineers(engineers.map(e => 
                      e.name === editingEngineer.name ? editingEngineer : e
                    ));
                    setEditingEngineer(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage Team Modal */}
        {managingEngineers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Manage Team Members</h3>
                <button onClick={() => setManagingEngineers(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Add New Engineer Form */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-800 mb-3">Add New Team Member</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      id="newEngineerName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input
                      type="text"
                      id="newEngineerRole"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., Operations Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours/Week</label>
                    <input
                      type="number"
                      id="newEngineerHours"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="40"
                      defaultValue="40"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const name = document.getElementById('newEngineerName').value;
                    const role = document.getElementById('newEngineerRole').value;
                    const totalHours = parseInt(document.getElementById('newEngineerHours').value) || 40;

                    if (name && role) {
                      const newEngineer = {
                        name,
                        role,
                        totalHours,
                        nonProjectTime: []
                      };

                      setEngineers([...engineers, newEngineer]);

                      // Clear form
                      document.getElementById('newEngineerName').value = '';
                      document.getElementById('newEngineerRole').value = '';
                      document.getElementById('newEngineerHours').value = '40';
                    } else {
                      alert('Please enter both name and role');
                    }
                  }}
                  className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Team Member
                </button>
              </div>

              {/* Current Team Members */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Current Team Members</h4>
                {engineers.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">No team members yet</p>
                ) : (
                  <div className="space-y-2">
                    {engineers.map((eng, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={eng.name}
                              onChange={(e) => {
                                const updated = [...engineers];
                                updated[idx].name = e.target.value;
                                setEngineers(updated);
                              }}
                              className="font-medium text-gray-800 px-2 py-1 border border-gray-300 rounded w-full"
                            />
                            <input
                              type="text"
                              value={eng.role}
                              onChange={(e) => {
                                const updated = [...engineers];
                                updated[idx].role = e.target.value;
                                setEngineers(updated);
                              }}
                              className="text-sm text-gray-600 px-2 py-1 border border-gray-300 rounded w-full mt-1"
                            />
                          </div>
                          <div className="ml-3 flex items-center space-x-2">
                            <div>
                              <label className="text-xs text-gray-500">Hours/Week</label>
                              <input
                                type="number"
                                value={eng.totalHours}
                                onChange={(e) => {
                                  const updated = [...engineers];
                                  updated[idx].totalHours = parseInt(e.target.value) || 40;
                                  setEngineers(updated);
                                }}
                                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                            </div>
                            <button
                              onClick={() => {
                                if (window.confirm(`Remove ${eng.name} from the team? This will also remove them from all project assignments.`)) {
                                  // Remove engineer
                                  setEngineers(engineers.filter((e, i) => i !== idx));
                                  
                                  // Remove from all project tasks
                                  setProjects(projects.map(p => ({
                                    ...p,
                                    tasks: p.tasks.filter(t => t.engineer !== eng.name)
                                  })));
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Remove team member"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 mt-6 border-t">
                <button
                  onClick={() => setManagingEngineers(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Operations Engineering Dashboard</h1>
          <p className="text-gray-600 mt-2">Project tracking, resource planning, and milestone management</p>
        </div>

        {renderTabs()}

        {activeTab === 'projects' && renderProjects()}
        {activeTab === 'roadmap' && renderRoadmap()}
        {activeTab === 'milestones' && renderMilestones()}
        {activeTab === 'resources' && renderResources()}
      </div>
    </div>
  );
};

export default OperationsDashboard;