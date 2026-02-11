
import React, { useState, useMemo } from 'react';
import { Task, Status, User } from '../types';

interface ArchiveViewProps {
  tasks: Task[];
  users: User[];
}

const ArchiveView: React.FC<ArchiveViewProps> = ({ tasks, users }) => {
  const [search, setSearch] = useState('');
  
  const finishedTasks = useMemo(() => {
    const all = [...tasks, ...tasks.flatMap(t => t.subTasks)];
    return all.filter(t => t.status === Status.FINISHED && 
      (t.title.toLowerCase().includes(search.toLowerCase()) || 
       t.handoffComment?.toLowerCase().includes(search.toLowerCase()))
    );
  }, [tasks, search]);

  return (
    <div className="p-8 space-y-8 max-w-[1700px] mx-auto animate-in slide-in-from-right duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b-2 border-slate-200 pb-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Finished Repository</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manager Overview & Quality Assurance</p>
        </div>
        <div className="relative w-full md:w-96">
           <svg className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
           <input 
             placeholder="Search by Title or Comments..." 
             className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {finishedTasks.map((task, idx) => (
          <div key={task.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-50 transition-all hover:border-emerald-200 hover:shadow-emerald-50">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1 space-y-4">
                 <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-300">#{idx + 1}</span>
                    <h3 className="text-xl font-black text-slate-900">{task.title}</h3>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-200">COMPLETED</span>
                 </div>
                 
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                       <img src={users.find(u => u.id === task.assigneeId)?.avatar} className="w-8 h-8 rounded-xl shadow-sm" alt="Assignee" />
                       <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                          <p className="text-slate-900 leading-none mb-1">{users.find(u => u.id === task.assigneeId)?.name}</p>
                          <p>{task.team}</p>
                       </div>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-100"></div>
                    <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                       <p className="text-slate-900 leading-none mb-1">Time Spent</p>
                       <p className="text-emerald-600">{task.durationHours}h {task.durationMinutes}m</p>
                    </div>
                 </div>

                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Final Handoff Output</p>
                    <p className="text-sm font-medium text-slate-700 italic">"{task.handoffComment || 'No comment provided.'}"</p>
                    {task.outputLink && (
                       <a href={task.outputLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-indigo-600 text-xs font-bold hover:underline">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                          View Deliverable Link
                       </a>
                    )}
                 </div>
              </div>

              <div className="w-full md:w-64 border-l border-slate-100 pl-6 space-y-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quality Rating</p>
                 <div className="flex gap-1">
                    {[1,2,3,4,5].map(star => (
                      <svg key={star} className={`w-8 h-8 ${task.rating && task.rating.stars >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    ))}
                 </div>
                 <button className="w-full py-3 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Write Review</button>
              </div>
            </div>
          </div>
        ))}

        {finishedTasks.length === 0 && (
          <div className="py-20 text-center text-slate-300 space-y-4">
             <svg className="w-16 h-16 mx-auto opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
             <p className="font-black uppercase tracking-widest">No matching records found in archive</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveView;
