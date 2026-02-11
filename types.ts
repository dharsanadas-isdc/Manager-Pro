
export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export enum Status {
  NOT_STARTED = 'Not Started',
  IN_PROGRESS = 'In Progress',
  FINISHED = 'Finished',
  AWAITING_CLARITY = 'Awaiting Clarity'
}

export interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  team: string;
}

export interface Project {
  id: string;
  name: string;
}

export interface Comment {
  id: string;
  fromUserId: string;
  toUserId?: string; // For seeking clarification
  text: string;
  timestamp: string;
  isClarification: boolean;
  replyText?: string;
}

export interface Rating {
  stars: number;
  comment: string;
}

export interface SubTask {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  assigneeId: string;
  creatorId: string;
  team: string;
  taskType: string;
  deadline?: string;
  completedAt?: string;
  handoffComment?: string;
  outputLink?: string;
  description?: string;
  durationHours: number;
  durationMinutes: number;
  estimatedHours?: number;
  rating?: Rating;
  comments: Comment[];
  documentHistory: Document[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  assigneeId: string;
  creatorId: string;
  team: string;
  taskType: string;
  deadline?: string;
  completedAt?: string;
  subTasks: SubTask[];
  documents: Document[];
  outputLink?: string;
  handoffComment?: string;
  createdAt: string;
  updatedAt: string;
  durationHours: number;
  durationMinutes: number;
  estimatedHours?: number;
  rating?: Rating;
  comments: Comment[];
  documentHistory: Document[];
}

export interface PerformanceData {
  name: string;
  completed: number;
  ongoing: number;
  efficiency: number;
}
