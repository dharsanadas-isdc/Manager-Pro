
import { initializeApp, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs,
  setDoc,
  Firestore
} from "firebase/firestore";
import { Task, Project } from "../types";

// Helper to safely get env vars, treating placeholder strings and "undefined" as invalid
const getEnv = (key: string): string | undefined => {
  const value = process.env[key];
  if (!value || 
      value === 'undefined' || 
      value === 'null' || 
      value.includes('your-project') || 
      value.includes('AIzaSy...')
  ) {
    return undefined;
  }
  return value;
};

const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY') || getEnv('API_KEY'),
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('FIREBASE_PROJECT_ID') || getEnv('PROJECT_ID'),
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('FIREBASE_APP_ID')
};

// Use a flag to track if we have a valid configuration to avoid "projects/undefined" errors
const isFirebaseConfigured = !!firebaseConfig.projectId && !!firebaseConfig.apiKey;

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
  }
} else {
  console.warn("Firebase configuration is missing or invalid. Check your .env file for FIREBASE_PROJECT_ID and FIREBASE_API_KEY.");
}

const TASKS_COLLECTION = "tasks";
const PROJECTS_COLLECTION = "projects";

/**
 * Real-time Subscription for Tasks
 */
export const subscribeToTasks = (callback: (tasks: Task[]) => void) => {
  if (!db || !isFirebaseConfigured) {
    // Return empty list immediately to stop loading spinners
    setTimeout(() => callback([]), 0);
    return () => {};
  }
  
  const q = query(collection(db, TASKS_COLLECTION), orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Task[];
    callback(tasks);
  }, (error) => {
    console.error("Firestore Task Subscription Error:", error);
    callback([]);
  });
};

/**
 * Real-time Subscription for Projects
 */
export const subscribeToProjects = (callback: (projects: Project[]) => void) => {
  if (!db || !isFirebaseConfigured) {
    setTimeout(() => callback([]), 0);
    return () => {};
  }

  const q = query(collection(db, PROJECTS_COLLECTION));
  
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Project[];
    callback(projects);
  }, (error) => {
    console.error("Firestore Project Subscription Error:", error);
    callback([]);
  });
};

/**
 * Add a Task to Firestore
 */
export const addTask = async (task: Omit<Task, 'id'>) => {
  if (!db || !isFirebaseConfigured) throw new Error("Firebase is not configured.");
  const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
    ...task,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return { ...task, id: docRef.id };
};

/**
 * Update a Task in Firestore
 */
export const updateTask = async (id: string, updates: Partial<Task>) => {
  if (!db || !isFirebaseConfigured) throw new Error("Firebase is not configured.");
  const docRef = doc(db, TASKS_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
};

/**
 * Delete a Task from Firestore
 */
export const deleteTask = async (id: string) => {
  if (!db || !isFirebaseConfigured) throw new Error("Firebase is not configured.");
  await deleteDoc(doc(db, TASKS_COLLECTION, id));
};

/**
 * Add a Project to Firestore
 */
export const addProject = async (name: string) => {
  if (!db || !isFirebaseConfigured) throw new Error("Firebase is not configured.");
  const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), { name });
  return { id: docRef.id, name };
};

/**
 * Delete a Project from Firestore
 */
export const deleteProject = async (id: string) => {
  if (!db || !isFirebaseConfigured) throw new Error("Firebase is not configured.");
  await deleteDoc(doc(db, PROJECTS_COLLECTION, id));
};

/**
 * Seed Initial Data (only if database is empty)
 */
export const seedInitialData = async (initialTasks: Task[], initialProjects: Project[]) => {
  if (!db || !isFirebaseConfigured) return;

  try {
    const tasksSnapshot = await getDocs(collection(db, TASKS_COLLECTION));
    const projectsSnapshot = await getDocs(collection(db, PROJECTS_COLLECTION));

    if (tasksSnapshot.empty && projectsSnapshot.empty) {
      console.log("Database empty. Seeding initial data...");
      
      for (const project of initialProjects) {
        const { id, ...data } = project;
        await setDoc(doc(db, PROJECTS_COLLECTION, id), data);
      }

      for (const task of initialTasks) {
        const { id, ...data } = task;
        await setDoc(doc(db, TASKS_COLLECTION, id), data);
      }
      
      console.log("Seeding complete.");
    }
  } catch (error) {
    console.error("Initial data seed failed:", error);
  }
};
