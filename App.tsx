
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Task, Status, Priority, User, Project, SubTask } from './types';
import { INITIAL_TASKS, MOCK_USERS, MOCK_PROJECTS, COLORS, TASK_TYPES } from './constants';
import Dashboard from './components/Dashboard';
import ArchiveView from './components/ArchiveView';
import { 
  subscribeToTasks, 
  subscribeToProjects, 
  updateTask as dbUpdateTask, 
  addTask as dbAddTask, 
  deleteTask as dbDeleteTask,
  seedInitialData,
  addProject as dbAddProject,
  deleteProject as dbDeleteProject,
  isSupabaseConfigured
} from './services/supabase';

const CURRENT_USER_ID = 'u1';

const HOUR_OPTIONS = [
  0,
  ...Array.from({ length: 10 }, (_, i) => (i + 1) * 0.5),
  ...Array.from({ length: 155 }, (_, i) => i + 6),
];

const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      const start = prevValue.current;
      const end = value;
      const duration = 400;
      let startTime: number | null = null;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        setDisplayValue(current);
        if (progress < 1) requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
      prevValue.current = value;
    }
  }, [value]);

  return <span>{displayValue}</span>;
};

const showNotification = (message: string) => {
  const toast = document.createElement('div');
  toast.className = "fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-2xl z-[100] border border-slate-700 font-medium animate-in slide-in-from-bottom duration-300";
  toast.innerHTML = `<div class="flex items-center gap-2"><div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div><span>${message}</span></div>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { if (toast.parentNode) document.body.removeChild(toast); }, 300);
  }, 3000);
};

const TaskStats: React.FC<{ tasks: Task[], activeFilter: Status | 'TOTAL' | null, setFilter: (s: Status | 'TOTAL' | null) => void }> = ({ tasks, activeFilter, setFilter }) => {
  const stats = useMemo(() => {
    const allItems = [...tasks, ...tasks.flatMap(t => t.subTasks)];
    return {
      total: allItems.length,
      notStarted: allItems.filter(t => t.status === Status.NOT_STARTED).length,
      ongoing: allItems.filter(t => t.status === Status.IN_PROGRESS).length,
      finished: allItems.filter(t => t.status === Status.FINISHED).length,
      awaiting: allItems.filter(t => t.status === Status.AWAITING_CLARITY).length,
    };
  }, [tasks]);

  const cards = [
    { label: 'Total Items', value: stats.total, color: 'text-slate-900', filter: 'TOTAL' as const },
    { label: 'Not Started', value: stats.notStarted, color: 'text-slate-400', filter: Status.NOT_STARTED },
    { label: 'On Going', value: stats.ongoing, color: 'text-indigo-600', filter: Status.IN_PROGRESS },
    { label: 'Awaiting Clarity', value: stats.awaiting, color: 'text-amber-600', filter: Status.AWAITING_CLARITY },
    { label: 'Finished', value: stats.finished, color: 'text-emerald-600', filter: Status.FINISHED },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 relative">
      <div className="absolute -top-6 right-2 flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
        <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
          {isSupabaseConfigured ? 'Live Workspace' : 'Offline / Config Pending'}
        </span>
      </div>
      {cards.map((s, i) => (
        <button 
          key={i} 
          onClick={() => setFilter(activeFilter === s.filter ? null : s.filter)}
          className={`bg-white p-6 rounded-2xl border transition-all text-left shadow-sm group hover:shadow-lg hover:-translate-y-1 ${activeFilter === s.filter ? 'border-indigo-500 ring-4 ring-indigo-50/50 bg-indigo-50/10' : 'border-slate-100'}`}
        >
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 group-hover:text-indigo-600 transition-colors">{s.label}</p>
          <p className={`text-4xl font-black ${s.color} tracking-tighter`}>
            <AnimatedCounter value={s.value} />
          </p>
        </button>
      ))}
    </div>
  );
};

const SpreadsheetRow: React.FC<{
  task: Task | SubTask,
  index: string,
  isSub?: boolean,
  projects: Project[],
  users: User[],
  taskTypes: string[],
  userRole: 'manager' | 'member',
  onUpdate: (id: string, updates: Partial<Task | SubTask>) => void,
  onHandoff: (task: Task | SubTask) => void,
  onAddSub?: (taskId: string) => void,
  onDelete: (id: string) => void,
  isExpanded?: boolean,
  onToggleExpand?: () => void
}> = ({ task, index, isSub, projects, users, taskTypes, userRole, onUpdate, onHandoff, onAddSub, onDelete, isExpanded, onToggleExpand }) => {
  const isAssignee = task.assigneeId === CURRENT_USER_ID;
  const canEditMainFields = userRole === 'manager' || (isSub && task.creatorId === CURRENT_USER_ID);
  const canEditPlanning = userRole === 'manager' || isAssignee || (isSub && task.creatorId === CURRENT_USER_ID);
  const canDelete = userRole === 'manager' || (isSub && task.creatorId === CURRENT_USER_ID);

  return (
    <tr className={`group transition-all relative border-b border-slate-100 ${isSub ? 'bg-slate-50/70 border-l-4 border-l-indigo-200' : 'hover:bg-slate-50'}`}>
      <td className="px-3 py-2 border-r border-slate-100 w-14 text-center font-bold text-slate-400 text-[11px]">{index}</td>
      <td className="px-3 py-2 border-r border-slate-100 min-w-[250px] relative">
        <div className="flex items-center gap-2">
          {!isSub && onToggleExpand && (
            <button onClick={onToggleExpand} className="text-slate-400 hover:text-indigo-600 w-4 font-black transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}>▶</button>
          )}
          <input 
            className={`w-full bg-transparent border-none p-0 focus:ring-0 font-bold outline-none ${task.status === Status.FINISHED ? 'line-through text-slate-300' : 'text-slate-800'}`}
            value={task.title}
            onChange={(e) => onUpdate(task.id, { title: e.target.value })}
            readOnly={!canEditMainFields}
          />
        </div>
      </td>
      <td className="px-3 py-2 border-r border-slate-100 w-44">
        {!isSub ? (
          <select disabled={userRole !== 'manager'} className="w-full bg-transparent border-none p-0 focus:ring-0 text-[11px] font-black text-slate-400 uppercase tracking-tight appearance-none outline-none" value={(task as Task).projectId || ''} onChange={(e) => onUpdate(task.id, { projectId: e.target.value } as any)}>
            <option value="" disabled>Select Project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        ) : <span className="text-[10px] font-bold text-slate-300 italic">Subtask</span>}
      </td>
      <td className="px-3 py-2 border-r border-slate-100 w-36">
        <input 
          type="date"
          className="w-full bg-transparent border-none p-0 focus:ring-0 text-[11px] font-bold text-slate-600 disabled:opacity-50 outline-none"
          value={task.deadline || ''}
          onChange={(e) => onUpdate(task.id, { deadline: e.target.value })}
          disabled={!canEditPlanning}
        />
      </td>
      <td className="px-3 py-2 border-r border-slate-100 w-24">
        <select 
          className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-black text-indigo-600 text-center disabled:opacity-50 appearance-none cursor-pointer outline-none"
          value={task.estimatedHours || 0}
          onChange={(e) => onUpdate(task.id, { estimatedHours: parseFloat(e.target.value) || 0 })}
          disabled={!canEditPlanning}
        >
          {HOUR_OPTIONS.map(val => (
            <option key={val} value={val}>{val === 0 ? '-' : val + 'h'}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2 border-r border-slate-100 w-40">
        <select disabled={!canEditMainFields} className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs text-indigo-600 font-bold outline-none appearance-none" value={task.taskType} onChange={(e) => onUpdate(task.id, { taskType: e.target.value })}>
          {taskTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </td>
      <td className="px-3 py-2 border-r border-slate-100 w-44">
        <select disabled={!canEditMainFields} className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs text-slate-600 font-medium outline-none appearance-none" value={task.assigneeId} onChange={(e) => onUpdate(task.id, { assigneeId: e.target.value })}>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </td>
      <td className="px-3 py-2 border-r border-slate-100 w-40">
        <select className={`px-2 py-1 rounded-md text-[10px] font-black uppercase border outline-none cursor-pointer w-full text-center transition-colors ${COLORS.status[task.status]}`} value={task.status} onChange={(e) => e.target.value === Status.FINISHED ? onHandoff(task) : onUpdate(task.id, { status: e.target.value as Status })}>
          {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </td>
      <td className="px-3 py-2 text-right w-32 pr-4">
        <div className="flex justify-end gap-3 items-center opacity-0 group-hover:opacity-100 transition-opacity">
          {!isSub && onAddSub && <button onClick={() => onAddSub(task.id)} className="text-indigo-600 font-bold hover:scale-125 transition-transform">＋</button>}
          {canDelete && <button onClick={() => onDelete(task.id)} className="text-red-400 font-bold hover:scale-125 transition-transform">✕</button>}
        </div>
      </td>
    </tr>
  );
};

const SpreadsheetView: React.FC<{ 
  userRole: 'manager' | 'member', 
  setUserRole: (r: 'manager' | 'member') => void,
  tasks: Task[],
  projects: Project[],
  loading: boolean
}> = ({ userRole, setUserRole, tasks, projects, loading }) => {
  const [taskTypes] = useState<string[]>(TASK_TYPES);
  const [users] = useState<User[]>(MOCK_USERS);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Status | 'TOTAL' | null>(null);
  const [handoffItem, setHandoffItem] = useState<{ id: string, isSub: boolean, parentId?: string } | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await dbUpdateTask(id, updates);
    } catch (err) {
      showNotification("Update failed.");
    }
  };

  const handleUpdateSubTask = async (taskId: string, subId: string, updates: Partial<SubTask>) => {
    const parentTask = tasks.find(t => t.id === taskId);
    if (!parentTask) return;
    const newSubTasks = parentTask.subTasks.map(s => s.id === subId ? { ...s, ...updates } : s);
    await dbUpdateTask(taskId, { subTasks: newSubTasks });
  };

  const addNewTask = async () => {
    setIsAddingTask(true);
    try {
      let targetProjectId = projects[0]?.id;
      if (!targetProjectId) {
        const newProj = await dbAddProject("Default Project");
        targetProjectId = newProj.id;
      }

      const newTask: Omit<Task, 'id'> = {
        projectId: targetProjectId,
        title: 'New Mission Item',
        description: '',
        priority: Priority.MEDIUM,
        status: Status.NOT_STARTED,
        assigneeId: CURRENT_USER_ID,
        creatorId: CURRENT_USER_ID,
        team: 'Design',
        taskType: taskTypes[0] || 'General',
        durationHours: 0,
        durationMinutes: 0,
        estimatedHours: 0,
        subTasks: [],
        documents: [],
        comments: [],
        documentHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await dbAddTask(newTask);
      showNotification("Item synchronized.");
    } catch (err) {
      showNotification("Offline sync failed.");
    } finally {
      setIsAddingTask(false);
    }
  };

  const addSubTask = async (taskId: string) => {
    const parentTask = tasks.find(t => t.id === taskId);
    if (!parentTask) return;

    const newSub: SubTask = {
      id: `s-${Date.now()}`,
      title: 'Action Point',
      status: Status.NOT_STARTED,
      priority: Priority.MEDIUM,
      assigneeId: CURRENT_USER_ID,
      creatorId: CURRENT_USER_ID,
      team: 'Design',
      taskType: taskTypes[0] || 'General',
      durationHours: 0,
      durationMinutes: 0,
      estimatedHours: 0,
      comments: [],
      documentHistory: []
    };
    
    await dbUpdateTask(taskId, { subTasks: [...parentTask.subTasks, newSub] });
    setExpandedTasks(prev => new Set(prev).add(taskId));
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if (statusFilter && statusFilter !== 'TOTAL') {
      filtered = tasks.filter(t => t.status === statusFilter || t.subTasks.some(s => s.status === statusFilter));
    }
    return filtered;
  }, [tasks, statusFilter]);

  if (loading && isSupabaseConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Connecting to Supabase...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-[1800px] mx-auto space-y-8 animate-in fade-in duration-500">
      {!isSupabaseConfigured && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
             <p className="text-xs font-bold text-amber-700 uppercase tracking-tight">Supabase Config Missing in Environment. Running in local mock mode.</p>
          </div>
          <button onClick={() => window.location.reload()} className="text-[10px] font-black uppercase text-amber-600 hover:underline">Check Again</button>
        </div>
      )}
      
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex gap-2">
          {userRole === 'manager' && (
            <button onClick={() => setIsProjectModalOpen(true)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-sm">Workspace Projects</button>
          )}
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
           <button onClick={() => setUserRole('member')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${userRole === 'member' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Member</button>
           <button onClick={() => setUserRole('manager')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${userRole === 'manager' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Manager</button>
        </div>
      </div>

      <TaskStats tasks={tasks} activeFilter={statusFilter} setFilter={setStatusFilter} />

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm border-collapse table-fixed min-w-[1200px]">
          <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-200">
            <tr>
              <th className="px-3 py-5 w-14">#</th>
              <th className="px-3 py-5 text-left min-w-[300px]">Description</th>
              <th className="px-3 py-5 text-left w-48">Project</th>
              <th className="px-3 py-5 text-left w-36">Deadline</th>
              <th className="px-3 py-5 text-center w-24">Est. Hrs</th>
              <th className="px-3 py-5 text-left w-40">Task Type</th>
              <th className="px-3 py-5 text-left w-44">Assignee</th>
              <th className="px-3 py-5 text-left w-40">Status</th>
              <th className="px-3 py-5 text-right w-32 pr-6">Manage</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No records found</td>
              </tr>
            ) : filteredTasks.map((task, idx) => (
              <React.Fragment key={task.id}>
                <SpreadsheetRow 
                  task={task} index={`${idx + 1}`} projects={projects} users={users} taskTypes={taskTypes} userRole={userRole}
                  onUpdate={handleUpdateTask} onHandoff={() => setHandoffItem({ id: task.id, isSub: false })}
                  onAddSub={addSubTask} onDelete={(id) => dbDeleteTask(id)}
                  isExpanded={expandedTasks.has(task.id)} onToggleExpand={() => setExpandedTasks(prev => { const n = new Set(prev); n.has(task.id) ? n.delete(task.id) : n.add(task.id); return n; })}
                />
                {expandedTasks.has(task.id) && task.subTasks.map((sub, sidx) => (
                  <SpreadsheetRow key={sub.id} task={sub} index={`${idx + 1}.${sidx + 1}`} isSub users={users} taskTypes={taskTypes} userRole={userRole} projects={projects}
                    onUpdate={(id, updates) => handleUpdateSubTask(task.id, id, updates)} onHandoff={() => setHandoffItem({ id: sub.id, isSub: true, parentId: task.id })}
                    onDelete={(id) => dbUpdateTask(task.id, { subTasks: task.subTasks.filter(s => s.id !== id) })}
                  />
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {userRole === 'manager' && (
          <button onClick={addNewTask} disabled={isAddingTask} className="w-full py-5 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 hover:bg-indigo-50 transition-all border-t border-slate-100 bg-white disabled:opacity-50 flex items-center justify-center gap-3">
            {isAddingTask ? <><div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>Saving...</> : '＋ Add New Mission Item'}
          </button>
        )}
      </div>

      {isProjectModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 p-8">
            <h2 className="text-xl font-black mb-6 text-slate-800 uppercase tracking-tight">Workspace Projects</h2>
            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2">
              {projects.map((p) => (
                <div key={p.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 tracking-tight">{p.name}</span>
                  <button onClick={() => dbDeleteProject(p.id)} className="text-red-400 font-bold hover:scale-110 p-2">✕</button>
                </div>
              ))}
            </div>
            <form onSubmit={async (e) => { 
              e.preventDefault(); 
              const val = (e.target as any).newProject.value; 
              if (val) await dbAddProject(val); 
              (e.target as any).reset(); 
            }} className="flex gap-2">
              <input name="newProject" className="flex-1 px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Project Name..." />
              <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest">Add</button>
            </form>
            <button onClick={() => setIsProjectModalOpen(false)} className="mt-8 w-full py-3 bg-slate-100 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-200">Dismiss</button>
          </div>
        </div>
      )}

      {handoffItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl">
          <div className="bg-white rounded-[40px] p-10 max-w-lg w-full text-center shadow-2xl border border-white/20">
            <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Deliverable Handoff</h2>
            <p className="text-slate-500 mb-8 font-medium">Finalizing this item will archive it and update analytics.</p>
            <button onClick={() => {
              if (handoffItem.isSub && handoffItem.parentId) handleUpdateSubTask(handoffItem.parentId, handoffItem.id, { status: Status.FINISHED, completedAt: new Date().toISOString() });
              else handleUpdateTask(handoffItem.id, { status: Status.FINISHED, completedAt: new Date().toISOString() });
              setHandoffItem(null);
              showNotification("Deliverable successfully handoffed.");
            }} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 transition-colors uppercase text-xs tracking-widest">Confirm Completion</button>
            <button onClick={() => setHandoffItem(null)} className="mt-6 text-slate-400 font-bold hover:text-slate-600 text-xs uppercase tracking-widest">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<'manager' | 'member'>('manager');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubTasks: () => void;
    let unsubProjects: () => void;

    const init = async () => {
      // Fallback to mock data if not configured
      if (!isSupabaseConfigured) {
        setTasks(INITIAL_TASKS);
        setProjects(MOCK_PROJECTS);
        setLoading(false);
        return;
      }
      
      // Seed and subscribe
      try {
        await seedInitialData(INITIAL_TASKS, MOCK_PROJECTS);
        unsubTasks = subscribeToTasks((data) => {
          setTasks(data.length > 0 ? [...data] : INITIAL_TASKS); 
          setLoading(false);
        });
        unsubProjects = subscribeToProjects((data) => {
          setProjects(data.length > 0 ? [...data] : MOCK_PROJECTS);
        });
      } catch (err) {
        setTasks(INITIAL_TASKS);
        setProjects(MOCK_PROJECTS);
        setLoading(false);
      }
    };

    init();

    return () => {
      if (unsubTasks) unsubTasks();
      if (unsubProjects) unsubProjects();
    };
  }, []);
  
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-inter antialiased pb-20">
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-[100] px-6 py-4 flex justify-between items-center shadow-sm">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg font-black text-xl transition-transform group-hover:scale-110">T</div>
            <span className="text-2xl font-black tracking-tighter hidden sm:block">TASK FIRST</span>
          </Link>
          <div className="flex gap-4 sm:gap-8">
            <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Workspace</Link>
            <Link to="/reports" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Insights</Link>
            <Link to="/archive" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Archive</Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">{userRole} View</span>
          </div>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<SpreadsheetView userRole={userRole} setUserRole={setUserRole} tasks={tasks} projects={projects} loading={loading} />} />
            <Route path="/reports" element={<Dashboard tasks={tasks} />} />
            <Route path="/archive" element={<ArchiveView tasks={tasks} users={MOCK_USERS} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
