export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
export type WorkType = 'Remote' | 'Hybrid' | 'On-site';

export interface JobPosting {
  id?: string;
  title: string;
  type: JobType;
  location: string;
  workType: WorkType;
  description: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  postedDate: string; // ISO date string
  isActive: boolean;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}
