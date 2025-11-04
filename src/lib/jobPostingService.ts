import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { logger } from './logger';
import type { JobPosting } from '../types/jobPosting';

const JOBS_COLLECTION = 'jobPostings';

/**
 * Create a new job posting
 */
export async function createJobPosting(jobData: Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const jobsRef = collection(db, JOBS_COLLECTION);
    const docRef = await addDoc(jobsRef, {
      ...jobData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    logger.info('Job posting created', { jobId: docRef.id, title: jobData.title });
    return docRef.id;
  } catch (error) {
    logger.error('Failed to create job posting', { error, jobData });
    throw new Error('Failed to create job posting');
  }
}

/**
 * Update an existing job posting
 */
export async function updateJobPosting(jobId: string, jobData: Partial<Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  try {
    const jobRef = doc(db, JOBS_COLLECTION, jobId);
    await updateDoc(jobRef, {
      ...jobData,
      updatedAt: serverTimestamp()
    });

    logger.info('Job posting updated', { jobId, updates: Object.keys(jobData) });
  } catch (error) {
    logger.error('Failed to update job posting', { error, jobId });
    throw new Error('Failed to update job posting');
  }
}

/**
 * Delete a job posting
 */
export async function deleteJobPosting(jobId: string): Promise<void> {
  try {
    const jobRef = doc(db, JOBS_COLLECTION, jobId);
    await deleteDoc(jobRef);

    logger.info('Job posting deleted', { jobId });
  } catch (error) {
    logger.error('Failed to delete job posting', { error, jobId });
    throw new Error('Failed to delete job posting');
  }
}

/**
 * Get a single job posting by ID
 */
export async function getJobPosting(jobId: string): Promise<JobPosting | null> {
  try {
    const jobRef = doc(db, JOBS_COLLECTION, jobId);
    const jobSnap = await getDoc(jobRef);

    if (!jobSnap.exists()) {
      return null;
    }

    const data = jobSnap.data();
    return {
      id: jobSnap.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt
    } as JobPosting;
  } catch (error) {
    logger.error('Failed to get job posting', { error, jobId });
    throw new Error('Failed to get job posting');
  }
}

/**
 * Get all job postings (for admin)
 */
export async function getAllJobPostings(): Promise<JobPosting[]> {
  try {
    const jobsRef = collection(db, JOBS_COLLECTION);
    const q = query(jobsRef, orderBy('postedDate', 'desc'));
    const querySnapshot = await getDocs(q);

    const jobs: JobPosting[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt
      } as JobPosting);
    });

    return jobs;
  } catch (error) {
    logger.error('Failed to get all job postings', { error });
    throw new Error('Failed to get job postings');
  }
}

/**
 * Get only active job postings (for public careers page)
 */
export async function getActiveJobPostings(): Promise<JobPosting[]> {
  try {
    const jobsRef = collection(db, JOBS_COLLECTION);
    const q = query(
      jobsRef,
      where('isActive', '==', true),
      orderBy('postedDate', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const jobs: JobPosting[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt
      } as JobPosting);
    });

    return jobs;
  } catch (error) {
    logger.error('Failed to get active job postings', { error });
    throw new Error('Failed to get active job postings');
  }
}
