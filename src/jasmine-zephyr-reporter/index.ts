import JiraService from '../services/jira-service';
import ZephyrService, {
  EntitiesType,
  ExecutionBody,
  Status,
} from '../services/zephyr-service';
import { Configuration } from '../types';
import { Utility } from '../utils';
import { ReporterOptions } from './reporter-options';

export default class JasmineZephyrReporter implements jasmine.CustomReporter {
  // Declaration
  private config: Configuration;
  private jiraService: JiraService;
  private zephyrService: ZephyrService;
  private utils: Utility;
  private testId: string | -1;
  private specsResult: SpecResult[];
  private reporterOptions: ReporterOptions;

  constructor(config: Configuration) {
    this.jiraService = new JiraService({
      baseUrl: config.HostUrl + '/rest',
      auth: config.auth,
    });

    this.zephyrService = new ZephyrService({
      baseUrl: config.HostUrl + '/rest/zapi/latest',
      auth: config.auth,
    });

    this.utils = new Utility();
    this.config = config;
    this.testId = '';
    this.specsResult = [];

    this.reporterOptions = new ReporterOptions(
      config,
      this.jiraService,
      this.zephyrService,
      this.utils
    );
  }

  // getters
  private get disable(): boolean {
    if (this.config.disable) return true;
    return false;
  }

  // private get JZRData ():Data {
  //     return this.data;
  // };

  // Setters
  private set disable(v: boolean) {
    this.config.disable = v;
  }

  async jasmineStarted(suiteInfo: jasmine.JasmineStartedInfo): Promise<void> {
    // Verify the required keys for `jasmine-zephyr-reporter` in order to connect jira server
    if (!this.disable && !this.utils.requiredKeys(this.config)) this.disable = true;

    // If project id not found or that there has a bad request on the first shot,
    // (authorization issus for example), Then project id will set to -1. and the reporter will disable
    if (!this.disable) {
      this.jiraService.data.projectId = await this.jiraService.getProjectId(
        this.config.projectIdOrKey
      );
      if (this.jiraService.data.projectId === -1) this.disable = true;
    }

    if (!this.disable) {
      // Version
      await this.reporterOptions.getVersionId();

      // Sprint
      await this.reporterOptions.getSprintId();

      // Delete old cycles
      await this.reporterOptions.deleteOldCycles();

      // Create cycle
      await this.reporterOptions.createCycle();
    }
  }
  async suiteStarted(result: jasmine.SuiteResult): Promise<void> {
    if (!this.disable) {
      // Take suites id for Zephyr tests
      this.testId = this.reporterOptions.TestExecutionID(result.description);

      // set issue id, if issue key is provided
      this.testId = await this.reporterOptions.getIssueId(this.testId);

      // If issueId not found or invalid
      if (this.testId === -1) {
        this.config.disable = true;
        return;
      }

      // Adding test to cycle
      await this.reporterOptions.addingExecutionToCycle(this.testId);

      // If execution id not found or invalid
      if (this.zephyrService.data.testExecutionId === -1) {
        this.config.disable = true;
        return;
      }

      // Get steps id
      await this.zephyrService.getStepResult();
    }
  }

  async specStarted(result: jasmine.SpecResult): Promise<void> {
    if (!this.disable) {
    }
  }
  async specDone(result: jasmine.SpecResult): Promise<void> {
    if (!this.disable) {
      this.specsResult.push(this.specInfo(result));
    }
  }
  async suiteDone(result: jasmine.SuiteResult): Promise<void> {
    if (!this.disable) {
      // Execute specs results
      await this.reporterOptions.ExecuteSpecs(this.specsResult);
      // Execute test result
      await this.reporterOptions.executeTest(result, this.specsResult);
    }

    // CleanUp at the end of test
    this.testId = '';
    this.specsResult = [];
  }
  async jasmineDone(runDetails: jasmine.JasmineDoneInfo): Promise<void> {
    if (!this.disable) {
      await this.reporterOptions.deleteAttachedDirContent();
    }
  }

  // ============================ Private methods ===========================
  /**
   * Get version id, if one has been requested.
   * Create a new one, or return -1 to `data.versionId` key
   * @returns void
   */
  private async getVersionId(): Promise<void> {
    // If version configuration has set
    if (this.config.options && this.config.options.versionConfiguration) {
      // If version id was set
      if (this.config.options.versionConfiguration.id) {
        this.jiraService.data.versionId = this.config.options.versionConfiguration.id;
      } else {
        // If version name (and board id) has set
        if (this.config.boardID && this.config.options.versionConfiguration.versionName) {
          this.jiraService.data.versionId = await this.jiraService.getVersionIdByName(
            this.config.boardID,
            this.config.options.versionConfiguration.versionName
          );
        }

        // If version creation has set
        if (this.config.options.versionConfiguration.createNewVersion) {
          this.jiraService.data.versionId -
            (await this.jiraService.createVersion(
              this.config.options.versionConfiguration.createNewVersion
            ));
        }
      }
    } else {
      this.jiraService.data.versionId = -1;
    }
  }

  /**
   * Get sprint by name or id. set to `data.sprintId`
   * @returns void
   */
  private async getSprintId(): Promise<void> {
    if (this.config.desiredSprintName) {
      this.jiraService.data.sprintId -
        (await this.jiraService.getSprintIDByName(
          this.config.boardID,
          this.config.desiredSprintName
        ));
    } else {
      this.jiraService.data.sprintId = await this.jiraService.getActiveSprintID(
        this.config.boardID
      );
    }
  }

  /**
   * Delete old cycles by the config that mention. (keepsInHistory etc.)
   */
  private async deleteOldCycles(): Promise<void> {
    if (this.config.options && this.config.options.cycleDeletionConfiguration) {
      await this.zephyrService.deleteOldCycles({
        projectId: this.jiraService.data.projectId,
        versionId: this.jiraService.data.versionId,
        config: this.config.options.cycleDeletionConfiguration,
      });
    }
  }

  /**
   * Create cycles according the config that mention in
   *  `config.options.cycleCreationConfig`
   */
  private async createCycle(): Promise<void> {
    if (this.config.options && this.config.options.cycleCreationConfig) {
      if (this.config.options.cycleCreationConfig.executeOnCycleID) {
        this.zephyrService.data.cycleId =
          this.config.options.cycleCreationConfig.executeOnCycleID;
      } else if (this.config.options.cycleCreationConfig.createNewCycle) {
        await this.zephyrService.createCycle({
          projectId: this.jiraService.data.projectId,
          versionId: this.jiraService.data.versionId,
          sprintId: this.jiraService.data.sprintId,
          cycleBody: this.config.options.cycleCreationConfig.createNewCycle,
        });
      }
    }
  }

  /**
   *
   * @param testId any
   * if testId is not a number
   */
  private async getIssueId(testId: any): Promise<any> {
    if (isNaN(testId)) {
      testId = await this.jiraService.getIssueKey(testId, 'id');
    }
    return testId;
  }

  /**
   * adding test execution to cycles
   */
  private async addingExecutionToCycle(testId: string): Promise<void> {
    if (this.config.options) {
      await this.zephyrService.addingTestExecution({
        projectId: this.jiraService.data.projectId,
        versionId: this.jiraService.data.versionId,
        cycleId: this.zephyrService.data.cycleId,
        issueId: +testId,
        config: this.config.options.TestExecutionConfig,
      });
    }
  }

  /**
   * @description
   * @returns void - if spec length NOT match the amount of steps at zephyr test
   */
  private async ExecuteSpecs() {
    if (this.zephyrService.data.stepsExecutionId.length !== this.specsResult.length) {
      this.config.disable = true;
      console.error('Steps are not in the same length');
      return;
    }

    for (let i = 0; i < this.zephyrService.data.stepsExecutionId.length; i++) {
      const stepId = this.zephyrService.data.stepsExecutionId[i];
      const state = this.specsResult[i].status;
      const body: ExecutionBody = {
        status: this.zephyrService.data.status[state],
        comment:
          (this.config.options &&
            this.config.options.stepResultConfig &&
            this.config.options.stepResultConfig.comment) ||
          this.specsResult[i].info,
      };

      await this.zephyrService.executeStep({
        stepId: stepId,
        body: body,
      });

      if (
        this.config.attachedContentDir &&
        this.config.options &&
        this.config.options.stepResultConfig
      ) {
        await this.attachedFiles({
          path: this.config.attachedContentDir,
          state: this.config.options.stepResultConfig.attachment,
          status: this.specsResult[i].status,
          newFoldername: this.specsResult[i].name,
          entityId: this.zephyrService.data.stepsExecutionId[i],
          entityType: 'step',
        });
      }
    }
  }

  /**
   *
   * @param result jasmine.SuiteResult
   * @description execute test.
   * The test will passed only in case that all specs are passed.
   * if one or more are not passed, the status of test will be by majority (except passed)
   */
  private async executeTest(result: jasmine.SuiteResult) {
    const state = this.testResultLogic();

    await this.zephyrService.executeTest({
      body: {
        status: this.zephyrService.data.status[state],
        comment: JSON.stringify(this.specsResult),
      },
    });

    if (
      this.config.attachedContentDir &&
      this.config.options &&
      this.config.options.TestResultConfig
    ) {
      await this.attachedFiles({
        path: this.config.attachedContentDir,
        state: this.config.options.TestResultConfig.attachment,
        status: state,
        newFoldername: 'resultDescription1',
        entityId: this.zephyrService.data.testExecutionId,
        entityType: 'test',
      });
    }
  }

  private async attachedFiles(o: AttachedFilesConfig) {
    if (
      !o ||
      !o.path ||
      !o.state ||
      (o.state === 'onFailure' && !o.status.includes('fail'))
    )
      return;

    const newFilesPath: string | -1 = await this.utils.fs.copyFilesToFolder(
      o.path,
      o.newFoldername
    );

    if (newFilesPath !== -1) {
      if (o.entityType !== 'issue') {
        await this.zephyrService.attachedFileToIssue({
          entityId: o.entityId,
          entityType: o.entityType,
          projectId: this.jiraService.data.projectId,
          filesDir: newFilesPath,
        });
      } else if (o.entityType === 'issue') {
        await this.jiraService.attachedFileToIssue(o.entityId, newFilesPath);
      }
    }
  }

  /**
   *
   * @param result jasmine.SpecResult
   * @returns specInfo
   */
  private specInfo(result: jasmine.SpecResult): SpecResult {
    const message: string =
      result.status === 'passed'
        ? `${result.passedExpectations[0].message} with matcher name ${result.passedExpectations[0].matcherName}`
        : result.status === 'failed'
        ? result.failedExpectations[0].message
        : result.status === 'pending'
        ? result.pendingReason
        : 'There is no info to provide';

    const specResult = {
      name: result.description,
      status: result.status as keyof Status,
      info: message,
      attachment:
        this.config.options &&
        this.config.options.stepResultConfig &&
        this.config.options.stepResultConfig?.attachment,
    };

    return specResult;
  }

  /**
   *
   * @param testDescription string
   * @description Extract the wanted issue id from suites description.
   * @returns execution id. if the execution id is invalid , return `-1`
   */
  private TestExecutionID(testDescription: string) {
    // Split description in order to get the value after @testID separated
    const description = testDescription.split(/ +|:/).filter((x) => x);
    // Get the value after @testId || @testID
    const executionID =
      description[
        (description.includes('@testId')
          ? description.indexOf('@testId')
          : description.indexOf('@testID')) + 1
      ];

    // Check if the executionId is valid.
    return /[A-Z]+-[0-9]+|[0-9]+/.test(executionID) ? executionID : -1;
  }

  /**
   * @description determined what is the test status according to all specs status
   * If `passed` status is exclusive on this test, then the status will be passed
   * If 'passed' status is not exclusive on this test, then we splice the `passed` value
   * from the counter, and the return value will be the majority of the rest statuses on this test
   * @returns status: Status.
   */
  private testResultLogic<k extends keyof Status>(): k {
    let store: any[] = [];
    const counter: Status = { passed: 0, failed: 0, pending: 0, excluded: 0 };

    // count status of each spec
    this.specsResult.forEach((step) => {
      counter[step.status]++;
    });

    // Filtering all the statuses that exist on this test
    store = Object.entries(counter).filter((x) => x[1]);

    // If passed option is not exclusive
    if (store.length > 1) store = store.filter((status) => !status[0].includes('pass'));

    // Sorted by the highest
    return store.sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * @description delete old attached content at the end of jasmine run
   * @returns void
   */
  public async deleteAttachedDirContent() {
    // Result folder
    let keepAlive = ['JZRResults'];

    if (this.config.options && this.config.options.attachmentDeletionConfig) {
      // If deleteAttachedDirContent set to false
      if (
        this.config.options.attachmentDeletionConfig.deleteAttachedDirContent === false
      ) {
        return;
      } else {
        if (this.config.options.attachmentDeletionConfig.except) {
          keepAlive = keepAlive.concat(
            this.config.options.attachmentDeletionConfig.except
          );
        }
        await this.utils.fs.deleteOldContentExcept(
          this.config.attachedContentDir,
          keepAlive
        );
      }
    }
  }
}

export type AttachedFilesConfig = {
  path: string;
  state: 'onFailure' | boolean;
  status: string;
  newFoldername: string;
  entityId: number;
  entityType: keyof EntitiesType | 'issue';
};

export type SpecResult = {
  name: string;
  status: keyof Status;
  info: string;
  attachment?: any;
};
