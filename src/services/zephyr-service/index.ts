import { HTTPClient } from '../../api/axiosInstance';
import { HttpConfiguration } from '../../types';
import FormData from 'form-data';
import { resolve } from 'path';
import { createReadStream, promises } from 'fs';

const { readdir } = promises;

/** Contains zephyr api options for `jasmine-zephyr-reporter` */
export default class ZephyrService extends HTTPClient {
   // Declaration
   public data: Data;
   public entitiesType: EntitiesType;

   constructor(config: HttpConfiguration) {
      super(config);

      // Initial
      this.data = {
         cycleId: -1,
         testExecutionId: -1,
         stepsExecutionId: [],
         status: {
            passed: 1,
            failed: 2,
            excluded: 3,
            pending: 4
         }
      };
      this.entitiesType = {
         test: 'SCHEDULE',
         step: 'testStepResult',
      };
   }

   //=============================== cycles =============================
   /**
    *
    * @param conf CreateCycle
    * @description create zephyr cycle with the giving data.
    * if no data has provided, `jasmine-zephyr-reporter` will create cycle with a default values
    * if ProjectId has not provided, or failed with the requests, cycleId Will be implemented with -1
    * @returns void.
    */
   async createCycle(conf: CreateCycle): Promise<number | void> {
      if (!conf.projectId || conf.projectId === -1) {
         this.data.cycleId = -1;
         return;
      }
      const data = {
         clonedCycleId: (conf.cycleBody && conf.cycleBody.clonedCycleId) || '',
         name:
            ((conf.cycleBody && conf.cycleBody.name) || 'jasmine-zephyr-reporter') +
            this.utils.attachDateToName(),
         environment: (conf.cycleBody && conf.cycleBody.environment) || '',
         description:
            (conf.cycleBody && conf.cycleBody.description) ||
            `jasmine-zephyr-reporter automate cycle`,
         startDate:
            this.utils.conformDateFormat(conf.cycleBody && conf.cycleBody.startDate) ||
            this.utils.getDate(),
         endDate:
            this.utils.conformDateFormat(conf.cycleBody && conf.cycleBody.endDate) ||
            this.utils.getDate(),
         projectId: conf.projectId,
         versionId: conf.versionId || '',
         cloneCustomFields: false,
      };

      // @ts-ignore
      if (conf.sprintId && conf.sprintId !== -1) data.sprintId = sprintId;

      try {
         const response = await this.methods.post('/cycle/', data);
         this.data.cycleId = response.data && response.data['id'] ? response.data['id'] : -1;
      } catch (error) {}
   }

   /**  */
   async deleteOldCycles(o: DeleteOldCycles): Promise<void> {
      let cyclesToDelete = [];
      if (!o || !o.projectId || o.projectId === -1 || !o.config.deleteOldCycle || o.versionId === -1) return;
      if (typeof o.config.deleteOldCycle === 'number') {
         cyclesToDelete.push(o.config.deleteOldCycle);
      }
      try {
         const response = await this.methods.get(
            `/cycle?projectId=${o.projectId}&versionId=${o.versionId}`
         );
         // Get all cycles under the giving project and version
         cyclesToDelete = Object.keys(response.data).filter((key: any) => !isNaN(key));

         // Filtering all cycles under the giving `config.keepCycles` key
         if (o.config.keepCycles) {
            cyclesToDelete = cyclesToDelete.filter(
               (c: string) => !o.config.keepCycles?.includes(c)
            );
         }

         // Filtering cycles if `config.keepInHistory`  key is set
         if (o.config.keepInHistory) {
            cyclesToDelete = cyclesToDelete.slice(
               o.config.keepInHistory,
               cyclesToDelete.length - 1
            );
         }

         for (const cycle of cyclesToDelete) {
            await this.methods.delete(`/cycle/${cycle}`);
         }
      } catch (error) {
         return;
      }
   }

   // ============================= Add Test (Executions) ============================
   async addingTestExecution(o: TestExecution): Promise<void> {
      if (!o || !o.projectId) this.data.testExecutionId - 1;
      const data = {
         cycleId: o.cycleId || this.data.cycleId,
         issueId: o.issueId,
         projectId: o.projectId,
         versionId: o.versionId || -1,
         assigneeType: (o.config && o.config.assigneeType) || 'assignee',
         assignee: (o.config && o.config.assignee) || this.config.auth.username,
         folderId: (o.config && o.config.folderId) || 1,
      };
      try {
         const response = await this.methods.post('/execution/', data);
         this.data.testExecutionId = (Object.values(response.data)[0] as any)['id'];
      } catch (error) {}
   }

   // ============================= get steps id =========================
   async getStepResult(): Promise<void> {
      if (this.data.testExecutionId === -1) return;
      try {
         const response = await this.methods.get(
            `/stepResult?executionId=${this.data.testExecutionId}`
         );
         this.data.stepsExecutionId = response.data.map((step: any) => step['id']);
      } catch (error) {}
   }

   // ============================= Execution ===========================
   /**
    *
    * @param o StepExecution
    * @returns void
    */
   async executeStep(o: ExecuteStep): Promise<void> {
      if (!o || !o.stepId || !o.body.status) return;
      const data = {
         status: o.body.status,
         comment: (o.body && o.body.comment) || '',
      };
      try {
         const response = await this.methods.put(`/stepResult/${o.stepId}`, data);
      } catch (error) {}
   }

   /**
    *
    * @param o TestExecution
    * @returns void
    */
   async executeTest(o: ExecuteTest): Promise<void> {
      if (!o || !o.body) return;
      const data = {
         status: o.body.status,
         comment: o.body.comment || '',
      };

      try {
         const response = await this.methods.put(
            `/execution/${this.data.testExecutionId}/execute`,
            data
         );
      } catch (error) {}
   }

   // =============================== attached files ================================
   /**
    *
    * @param issueId number
    * @param filesDir string
    * @description attached files to issue id.
    * The type of files that we tested and can be attached are: [txt, json, png, zip, video: [wmv]]
    * Most likely more types of files can be also attached to it.
    */
   async attachedFileToIssue(o: AttachedFile) {
      if (!o || !o.projectId || !o.entityId || !o.entityType || !o.filesDir) return;

      // read files name at the giving path
      const files = await readdir(o.filesDir /*resolve(filesDir)*/);
      for (const filename of files) {
         const path = resolve(o.filesDir, filename);
         // Read contact
         const file = createReadStream(path);
         const form = new FormData();
         // Convert it to form-data type (Content-Type: multipart/form-data header)
         form.append('file', file, { filename: filename });

         try {
            const response = await this.methods.post(
               `/attachment?entityId=${o.entityId}&entityType=${
                  this.entitiesType[o.entityType]
               }&projectId=${o.projectId}`,
               form,
               {
                  headers: {
                     ...form.getHeaders(),
                  },
               }
            );
         } catch (error) {
            return -1;
         }
      }
   }
}

export type EntitiesType = Record<'test' | 'step', string>;

type CreateCycle = {
   projectId: number;
   versionId?: number;
   sprintId?: number;
   cycleBody?: CycleBody;
};

type CycleBody = {
   clonedCycleId?: string;
   name?: string;
   environment?: string;
   description?: string;
   /** As dd/MMM/YY format */
   startDate?: string;
   /** As dd/MMM/YY format */
   endDate?: string;
};

type DeleteOldCycles = {
   projectId: number;
   versionId: number;
   config: DeleteCycleConfig;
};

type DeleteCycleConfig = {
   /**
    * If a specific cycle id was mention,Then this cycle will be deleted
    * If true, is set, `jasmine-zephyr-reporter`
    * will delete all cycles under the version id of the current cycle.
    * If no version id has mention for the current cycle, no deletion will accrue.
    */
   deleteOldCycle: boolean | number;
   /**
    * Whether to keep N cycles in history.
    * If set, `jasmine-zephyr-reporter` will delete cycles until his reaches the amount.
    * The amount of is not includes dose in `keepCycles`
    */
   keepInHistory?: number;
   /**
    * Whether to keeps some cycles
    * To get the cycles id,
    * go to baseUrl + '/cycle?projectId=${yourProjectID}&versionId=${yourVersionID}'
    * then filter the ones your what to keep
    */
   keepCycles?: string[];
};

type TestExecution = {
   issueId: number;
   cycleId: number;
   projectId: number;
   versionId?: number;
   config?: {
      assigneeType?: string;
      assignee?: string;
      folderId?: string;
   };
};

export type ExecuteStep = {
   stepId: number;
   body: ExecutionBody;
};

type ExecuteTest = {
   body: ExecutionBody;
};

export type ExecutionBody = {
   status: string;
   comment?: any;
};

type AttachedFile = {
   entityId: number;
   entityType: keyof EntitiesType;
   projectId: number;
   filesDir: string;
};

export type Status = Record<'passed' | 'failed' | 'excluded' | 'pending', number>; 



type Data = {
   cycleId: number;
   testExecutionId: number;
   stepsExecutionId: number[];
   status: Status;
};