
import React from 'react';
import { Task, Priority, Status, User } from '../types';
import { COLORS, MOCK_USERS } from '../constants';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onStatusChange: (id: string, status: Status) => void;
  onReassign: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onStatusChange, onReassign }) => {
  const assignee = MOCK_USERS.find(u => u.id === task.assigneeId);
  // Fix: Property 'isCompleted' does not exist on type 'SubTask'. Checking status instead.
  const completedSubtasks = task.subTasks.filter(s => s.status === Status.FINISHED).length;
  const progress = task.subTasks.length > 0 ? (completedSubtasks / task.subTasks.length) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${COLORS.priority[task.priority]}`}>
          {task.priority}
        </span>
        <div className="flex gap-2">
          <button onClick={() => onEdit(task)} className="text-slate-400 hover:text-indigo-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          </button>
        </div>
      </div>

      <h3 className="font-bold text-slate-800 text-lg mb-1 leading-tight">{task.title}</h3>
      <p className="text-slate-500 text-sm mb-4 line-clamp-2">{task.description}</p>

      <div className="mb-4">
        <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
          <span>Progress</span>
          <span>{completedSubtasks}/{task.subTasks.length}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {assignee && (
            <div className="flex items-center gap-2">
              <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full ring-2 ring-white" />
              <span className="text-xs font-medium text-slate-600">{assignee.name}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <select 
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as Status)}
            className={`text-xs font-semibold px-2 py-1 rounded border outline-none cursor-pointer ${COLORS.status[task.status]}`}
          >
            {Object.values(Status).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button 
            onClick={() => onReassign(task)}
            className="p-1 text-slate-400 hover:text-indigo-600 border border-transparent hover:border-slate-200 rounded"
            title="Reassign Task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
