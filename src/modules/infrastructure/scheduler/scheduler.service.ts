import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

@Injectable()
export class SchedulerService {
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  addCronJob(name: string, cronTime: string, callback: () => any): void {
    const job = new CronJob(cronTime, callback);
    this.schedulerRegistry.addCronJob(name, job);
    job.start();
  }

  deleteCronJob(name: string): void {
    this.schedulerRegistry.deleteCronJob(name);
  }

  getCronJobs(): Map<string, CronJob> {
    return this.schedulerRegistry.getCronJobs();
  }
} 