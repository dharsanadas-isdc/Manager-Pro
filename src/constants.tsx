
import { Priority, Status, User, Project, Task } from './types';

export const COLORS = {
  priority: {
    [Priority.LOW]: 'bg-slate-100 text-slate-600 border-slate-200',
    [Priority.MEDIUM]: 'bg-blue-100 text-blue-700 border-blue-200',
    [Priority.HIGH]: 'bg-orange-100 text-orange-700 border-orange-200',
    [Priority.URGENT]: 'bg-red-100 text-red-700 border-red-200',
  },
  status: {
    [Status.NOT_STARTED]: 'bg-slate-100 text-slate-500 border-slate-200',
    [Status.IN_PROGRESS]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    [Status.FINISHED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [Status.AWAITING_CLARITY]: 'bg-amber-100 text-amber-700 border-amber-200',
  }
};

export const TASK_TYPES = [
  'UI Design', 'Backend Dev', 'Frontend Dev', 'UX Research', 
  'Unit Testing', 'QA Review', 'Copywriting', 'SEO Optimization', 
  'Stakeholder Review', 'Deployment'
];

export const INITIAL_DEPARTMENTS = [
  'Design', 
  'Coding', 
  'Testing', 
  'Content', 
  'Digital Marketing', 
  'Leadership', 
  'Delivery'
];

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'Alpha Redesign' },
  { id: 'p2', name: 'Stripe Integration' },
  { id: 'p3', name: 'Mobile App V2' }
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alex Rivera', email: 'alex@taskfirst.com', avatar: 'https://picsum.photos/seed/u1/40', team: 'Design' },
  { id: 'u2', name: 'Jordan Smith', email: 'jordan@taskfirst.com', avatar: 'https://picsum.photos/seed/u2/40', team: 'Coding' },
  { id: 'u3', name: 'Casey Jones', email: 'casey@taskfirst.com', avatar: 'https://picsum.photos/seed/u3/40', team: 'Testing' },
  { id: 'u4', name: 'Sam Taylor', email: 'sam@taskfirst.com', avatar: 'https://picsum.photos/seed/u4/40', team: 'Content' },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    projectId: 'p1',
    title: 'Brand Identity Overhaul',
    description: 'Refresh the logo and digital assets.',
    priority: Priority.HIGH,
    status: Status.IN_PROGRESS,
    assigneeId: 'u1',
    creatorId: 'u1',
    team: 'Design',
    taskType: 'UI Design',
    deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    estimatedHours: 40,
    subTasks: [
      { 
        id: 's1', 
        title: 'Logo Sketching', 
        status: Status.FINISHED, 
        priority: Priority.MEDIUM, 
        assigneeId: 'u1', 
        creatorId: 'u1',
        team: 'Design',
        taskType: 'UX Research',
        deadline: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        estimatedHours: 8,
        handoffComment: 'Initial sketches done.',
        durationHours: 4,
        durationMinutes: 30,
        comments: [],
        documentHistory: [{ id: 'd1', name: 'Draft 1.png', url: '#', type: 'image/png', uploadedAt: new Date().toISOString() }]
      }
    ],
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    durationHours: 12,
    durationMinutes: 0,
    comments: [],
    documentHistory: []
  },
  {
    id: 't2',
    projectId: 'p2',
    title: 'API Integration - Payments',
    description: 'Integrate Stripe Connect.',
    priority: Priority.URGENT,
    status: Status.NOT_STARTED,
    assigneeId: 'u2',
    creatorId: 'u1',
    team: 'Coding',
    taskType: 'Backend Dev',
    deadline: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    estimatedHours: 120,
    subTasks: [],
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    durationHours: 24,
    durationMinutes: 0,
    comments: [
      { id: 'c1', fromUserId: 'u2', toUserId: 'u1', text: 'Does the API need to support multi-currency?', timestamp: new Date().toISOString(), isClarification: true }
    ],
    documentHistory: []
  }
];
