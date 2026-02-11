
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Task, Project } from "../types";

// Direct access to process.env properties as per environment standards
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

// Configuration check: Ensure strings are not empty and not placeholder strings
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'undefined' && 
  supabaseAnonKey !== 'undefined'
);

// Initialize the client
export const supabase: SupabaseClient | null = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;

const TASKS_TABLE = 'tasks';
const PROJECTS_TABLE = 'projects';

/**
 * Mapping utilities for Database <-> Frontend consistency
 */
const mapTask = (data: any): Task => ({
  id: data.id,
  projectId: data.project_id,
  title: data.title,
  description: data.description,
  priority: data.priority,
  status: data.status,
  assigneeId: data.assignee_id,
  creatorId: data.creator_id,
  team: data.team,
  taskType: data.task_type,
  deadline: data.deadline,
  completedAt: data.completed_at,
  subTasks: data.sub_tasks || [],
  documents: data.documents || [],
  outputLink: data.output_link,
  handoffComment: data.handoff_comment,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  durationHours: data.duration_hours || 0,
  durationMinutes: data.duration_minutes || 0,
  estimatedHours: data.estimated_hours || 0,
  rating: data.rating,
  comments: data.comments || [],
  documentHistory: data.document_history || []
});

const mapToSupabaseTask = (task: Partial<Task>) => {
  const mapped: any = {};
  if (task.projectId !== undefined) mapped.project_id = task.projectId;
  if (task.title !== undefined) mapped.title = task.title;
  if (task.description !== undefined) mapped.description = task.description;
  if (task.priority !== undefined) mapped.priority = task.priority;
  if (task.status !== undefined) mapped.status = task.status;
  if (task.assigneeId !== undefined) mapped.assignee_id = task.assigneeId;
  if (task.creatorId !== undefined) mapped.creator_id = task.creatorId;
  if (task.team !== undefined) mapped.team = task.team;
  if (task.taskType !== undefined) mapped.task_type = task.taskType;
  if (task.deadline !== undefined) mapped.deadline = task.deadline;
  if (task.completedAt !== undefined) mapped.completed_at = task.completedAt;
  if (task.subTasks !== undefined) mapped.sub_tasks = task.subTasks;
  if (task.documents !== undefined) mapped.documents = task.documents;
  if (task.outputLink !== undefined) mapped.output_link = task.outputLink;
  if (task.handoffComment !== undefined) mapped.handoff_comment = task.handoffComment;
  if (task.durationHours !== undefined) mapped.duration_hours = task.durationHours;
  if (task.durationMinutes !== undefined) mapped.duration_minutes = task.durationMinutes;
  if (task.estimatedHours !== undefined) mapped.estimated_hours = task.estimatedHours;
  if (task.rating !== undefined) mapped.rating = task.rating;
  if (task.comments !== undefined) mapped.comments = task.comments;
  if (task.documentHistory !== undefined) mapped.document_history = task.documentHistory;
  mapped.updated_at = new Date().toISOString();
  return mapped;
};

export const subscribeToTasks = (callback: (tasks: Task[]) => void) => {
  if (!supabase) {
    callback([]);
    return () => {};
  }

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase!
        .from(TASKS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      callback(data.map(mapTask));
    } catch (e) {
      console.error("Fetch tasks failed:", e);
      callback([]);
    }
  };

  const channel = supabase!
    .channel('tasks-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: TASKS_TABLE }, () => {
      fetchTasks();
    })
    .subscribe();

  fetchTasks();
  return () => { supabase!.removeChannel(channel); };
};

export const subscribeToProjects = (callback: (projects: Project[]) => void) => {
  if (!supabase) {
    callback([]);
    return () => {};
  }

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase!
        .from(PROJECTS_TABLE)
        .select('*');
      
      if (error) throw error;
      callback(data);
    } catch (e) {
      console.error("Fetch projects failed:", e);
      callback([]);
    }
  };

  const channel = supabase!
    .channel('projects-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: PROJECTS_TABLE }, () => {
      fetchProjects();
    })
    .subscribe();

  fetchProjects();
  return () => { supabase!.removeChannel(channel); };
};

export const addTask = async (task: Omit<Task, 'id'>) => {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase!
    .from(TASKS_TABLE)
    .insert([{ ...mapToSupabaseTask(task), created_at: new Date().toISOString() }])
    .select();

  if (error) throw error;
  return mapTask(data[0]);
};

export const updateTask = async (id: string, updates: Partial<Task>) => {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase!
    .from(TASKS_TABLE)
    .update(mapToSupabaseTask(updates))
    .eq('id', id);

  if (error) throw error;
};

export const deleteTask = async (id: string) => {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase!
    .from(TASKS_TABLE)
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const addProject = async (name: string) => {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase!
    .from(PROJECTS_TABLE)
    .insert([{ name }])
    .select();

  if (error) throw error;
  return data[0] as Project;
};

export const deleteProject = async (id: string) => {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase!
    .from(PROJECTS_TABLE)
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const seedInitialData = async (initialTasks: Task[], initialProjects: Project[]) => {
  if (!supabase) return;

  try {
    const { count: taskCount } = await supabase!.from(TASKS_TABLE).select('*', { count: 'exact', head: true });
    const { count: projectCount } = await supabase!.from(PROJECTS_TABLE).select('*', { count: 'exact', head: true });

    if (taskCount === 0 && projectCount === 0) {
      console.log("Seeding data to Supabase...");
      for (const project of initialProjects) {
        const { id, ...data } = project;
        await supabase!.from(PROJECTS_TABLE).upsert({ id, ...data });
      }
      for (const task of initialTasks) {
        const { id, ...data } = task;
        await supabase!.from(TASKS_TABLE).upsert({ id, ...mapToSupabaseTask(data as any) });
      }
    }
  } catch (err) {
    console.warn('Initial data seed skipped:', err);
  }
};
