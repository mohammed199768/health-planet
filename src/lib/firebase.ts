import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export type Employee = {
  id: string;
  name: string;
  phone: string;
  profession: string;
  joinDate: string;
  address: string;
  tasksCompleted: number;
  created_at: string;
};

export type Booking = {
  id: string;
  name: string;
  phone: string;
  address: string;
  date: string;
  time: string;
  packageName: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedEmployeeId?: string;
  executionTime?: string;
  executionLocation?: string;
  notes?: string;
  createdAt: any;
};
