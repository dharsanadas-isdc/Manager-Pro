
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Task, Status, SubTask } from '../types';
import { MOCK_USERS } from '../constants';

interface DashboardProps {
  tasks: Task[];
}

const Dashboard: React.FC<DashboardProps> = ({ tasks }) => {
  // Use a refresh key to trigger recharts re-draw when data changes
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [tasks]);

  const allItems = useMemo(() => {
    const list: (Task | SubTask)[] = [];
    tasks.forEach(t => {
      list.push(t);
      t.subTasks.forEach(s => list.push(s));
    });
    return list;
  }, [tasks]);

  // Completion Precision (Deadline Accuracy)
  const completionStats = useMemo(() => {
    const finished = allItems.filter(t => t.status === Status.FINISHED);
    let onTime = 0;
    let late = 0;
    let early = 0;

    finished.forEach(t => {
      if (!t.deadline || !t.completedAt) {
        onTime++;
        return;
      }
      const due = new Date(t.deadline).getTime();
      const comp = new Date(t.completedAt).getTime();
      const diff = due - comp;
      
      if (diff > 86400000) early++;
      else if (diff < 0) late++;
      else onTime++;
    });

    return [
      { name: 'Early', value: early, color: '#10b981' },
      { name: 'On Time', value: onTime, color: '#6366f1' },
      { name: 'Late', value: late, color: '#ef4444' }
    ];
  }, [allItems]);

  // Department Wise Output Analysis
  const departmentData = useMemo(() => {
    const stats: Record<string, { tasks: number, hours: number, est: number }> = {};
    allItems.forEach(t => {
      const dept = t.team || 'Unassigned';
      if (!stats[dept]) stats[dept] = { tasks: 0, hours: 0, est: 0 };
      stats[dept].tasks++;
      if (t.status === Status.FINISHED) {
        stats[dept].hours += (t.durationHours || 0) + ((t.durationMinutes || 0) / 60);
      }
      stats[dept].est += (t.estimatedHours || 0);
    });
    return Object.entries(stats).map(([name, data]) => ({
      name,
      tasks: data.tasks,
      actualHours: Math.round(data.hours * 10) / 10,
      estimatedHours: data.est
    })).sort((a, b) => b.tasks - a.tasks);
  }, [allItems]);

  // Individual Output Analysis
  const individualData = useMemo(() => {
    const stats: Record<string, { completed: number, ongoing: number, efficiency: number, totalHrs: number }> = {};
    
    allItems.forEach(t => {
      const user = MOCK_USERS.find(u => u.id === t.assigneeId)?.name || 'Unknown';
      if (!stats[user]) stats[user] = { completed: 0, ongoing: 0, efficiency: 0, totalHrs: 0 };
      
      if (t.status === Status.FINISHED) {
        stats[user].completed++;
        const actual = (t.durationHours || 0) + ((t.durationMinutes || 0) / 60);
        const est = (t.estimatedHours || 0);
        stats[user].totalHrs += actual;
        if (actual > 0 && est > 0) {
          const ratio = (est / actual) * 100;
          stats[user].efficiency = stats[user].efficiency === 0 ? ratio : (stats[user].efficiency + ratio) / 2;
        }
      } else {
        stats[user].ongoing++;
      }
    });

    return Object.entries(stats).map(([name, data]) => ({
      name,
      completed: data.completed,
      ongoing: data.ongoing,
      efficiency: Math.round(data.efficiency),
      totalHrs: Math.round(data.totalHrs * 10) / 10
    })).sort((a, b) => b.completed - a.completed);
  }, [allItems]);

  const summary = useMemo(() => ([
    { label: 'Completion Precision', value: `${Math.round((completionStats[0].value + completionStats[1].value) / (allItems.filter(t => t.status === Status.FINISHED).length || 1) * 100)}%`, color: 'text-emerald-600' },
    { label: 'Aggregate Output (Hrs)', value: Math.round(allItems.reduce((acc, t) => acc + (t.durationHours || 0), 0)), color: 'text-indigo-600' },
    { label: 'Workforce Velocity', value: `${individualData[0]?.efficiency || 0}%`, color: 'text-blue-600' },
    { label: 'Task Load Factor', value: (allItems.length / MOCK_USERS.length).toFixed(1), color: 'text-slate-600' }
  ]), [allItems, completionStats, individualData]);

  return (
    <div key={refreshKey} className="p-8 space-y-12 max-w-[1700px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Intelligence Hub</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3">High-Granularity Operational Metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summary.map((stat, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-indigo-100/40 transition-all group">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 group-hover:text-indigo-500 transition-colors">{stat.label}</p>
            <h4 className={`text-5xl font-black ${stat.color} tracking-tighter`}>{stat.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10 w-full text-center">Handoff Precision</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={completionStats} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value">
                  {completionStats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-2 bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10">Department Output Analysis</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="top" align="right" />
                <Bar dataKey="tasks" name="Item Count" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
                <Bar dataKey="actualHours" name="Actual Hours" fill="#10b981" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
