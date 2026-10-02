export interface ICronJobConfig {
  name: string;
  schedule: string;
  description?: string;
  runImmediately?: boolean;
}

export interface ICronExecutionResult {
  jobName: string;
  processedCount: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}
