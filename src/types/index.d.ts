import { ResponseType, AxiosResponse, AxiosRequestConfig } from 'axios';

export interface Configuration {
   // /**
   //  * `JiraHostUrl`
   //  * @description a Url where your jira software is hosted.
   //  * If you are working in a compony that hold license for jira, must likely,
   //  * Jira will be set on the compony server. If you are working as individual
   //  * with this package on your own jira account, The hostName will be the one you
   //  * set when you sign up to jira accounts .For Example, my own jira account is:
   //  * `https://yehielshamirdev.atlassian.net/rest`.
   //  * If `jiraHostUrl` will not be provided, `jasmine-zephyr-reporter` will terminated.
   //  * */
   // JiraHostUrl: string;
   // /** `ZephyrHostUrl`
   //  * @description a url where zephyr service is hosted.
   //  * As `JiraHostUrl` the authority of the url (example.com) is also depend on if
   //  * you're working in a company or on your own project.
   //  * For example, if I keep with my jira account. the url will be:
   //  * `https://yehielshamirdev.atlassian.net/rest/zapi/latest` .
   //  * @default ""
   //  */
   // ZephyrHostUrl: string;
   HostUrl: string;
   /**
    * `auth`
    * @description a object that contains two keys.
    * 1. `username` as string that contains your user name for jira.
    * 2. `password`. In password section we have two options.
    * Up until Jira in latest versions,in order to make http request that demand authorization
    * you're required to send along with the request your own username and password as base64 string.
    * but recently Jira team Increase their security level on basic authorization when sending http request.
    * so the password is no longer your own password as base64 but a `"apiToken"`.
    * So if your organization have a oldest version of jira you will need to pass your password.
    * If you have a newest versions, then your need to [create apiToken](https://id.atlassian.com/manage-profile/security/api-tokens) an paste it here.
    * @default {username: "", password: ""}
    */
   auth: { username: string; password: string };
   /** `projectIdOrKey`
    * @description This key is essential for `Jasmine_zephyr_Reporter`.
    * If you have the project id, pass it here.
    * If you don't have the project id,pass the project key. (The project key is, for most,
    * includes in the issues name. for example: issue `JZR-123`, means that my project key is `JZR`).
    * You should know, getting project id by project key, is very easy. all you need to do is go via
    * browser to url : `https://${HostUrl}/rest/api/latest/project/{project key}`. for example :
    * https://yehielshamirdev.atlassian.net/rest/api/latest/project/{project key}`
    * @default ""
    */
   projectIdOrKey: number | string;
   /**
    * `boardID`
    * @description `boardID` key is optional.
    * Its necessary mainly if you want to open issues on a board. (Feature designed).
    * Also, with out boardId, the abilities of delete cycle, versionByName and attached cycles to sprints will not work.
    * So, is highly recommended to pass the boardID
    * ---
    * Board ID can be found on your url of the board-page in two ways.
    * 1. search in the url for a key `rapidView=${id}`
    * 2. The endpoint of the url. for Example: https://host.com/rest/agile/latest/board/${id}
    * @default -1
    */
   boardID?: number;

   /**
    * Name of desired sprint
    * `jasmine-zephyr-reporter` will search for the desired sprint id in the boardID mention above.
    * This is only work with `boardID`
    */
   desiredSprintName?: string;
   /**
    * `breakOnBadConnectionKeys`
    * @description Whether `Jasmine_Zephyr_Reporter` will break the run if failed to connect to jira or zephyr.
    * We recommend is to keep it on false. So that your project will be as less dependent on others as possible.
    * My recommended is to keep it on false, so that your project will
    * be depended as less as it possible on third side libraries.
    * @default false
    */
   breakOnBadConnectionKeys?: boolean;
   /**
    * Whether to disable `Jasmine_Zephyr_Reporter`. if set to true, `JZR` will not do anything.
    * **Note!**
    * > As I build this package, I search for a build-in disable option of jasmine.
    * But so far I only manege to find an option of disable a custom reporter outside of the reporter body.
    * By adding in your jasmine helper file the `provideFallbackReporter()`. like this:
    * > ```
    * jasmine.getEnv().provideFallbackReporter(new Jasmine_Zephyr_Reporter{yourConfiguration});
    * > ```
    * > So, at the moment I did a little work around for `disable` option..
    *
    * If you're familiar with an option on how to disable A `jasmine.customReporter` from the inside, please inform me.
    * @default false
    */
   disable?: boolean;
   /**
    * @feature
    * @description whether to open issus on a sprint. `boardID` must be passed.
    * In order to work with this option, you must declare in your step description on this.
    *
    * @default false
    */
   openBugsOnFailureInBoard?: boolean;
   /**
    * @feature
    * The folder which all the current files to be attached, are storage
    * The allows files types at the moment are: txt,json,png,zip,video like wmv
    * Path should ba path like this:
    * ```
    * attachedContentDir: '/out/JZR_attachmentFiles'
    * ```
    * If no `attachedContentDir` has mention, screenshot ability will be off
    */
   attachedContentDir: string;

   /**
    * The catch part in case of a failure with the request
    * - `ErrorInfo` print out the error with a Error object structure.
    * - `log` print out to the console the error accrue
    * - `silent` will send out at the end of run log file with all the info `jasmine-zephyr-reporter` will collect.
    *    The log file will be added to the mention dir in `attachedContentDir`. under `JZRResults` folder.
    *    if no dir has been mention, the default will be `out/JZEResults`
    *
    */
   errorHandling: 'ErrorInfo' | 'log' | 'silent';

   /**
    * More options to config to `jasmine-zephyr-reporter` like `cycleCreation` and so on
    */
   options?: {
      /**
       * Whether to delete the local store of the attachedDir at the end of a run
       * @default true
       */
      attachmentDeletionConfig?: {
         /** @default true */
         deleteAttachedDirContent: boolean;
         /** What files or directories to keep alive */
         except?: string[];
      };
      /**
       * Whether to run the cycle on a version
       * Version id can be declare in two ways.
       * 1. by is id. If id is provided =, the cycle will run on the mention version.
       * 2. By version name (For example: 21.3) . When version name is provided,
       * `jasmine-zephyr-reporter` will try to search for it under the projectID mention above.
       * If no version id found, the cycle will run on a the `unknown` folder
       */
      versionConfiguration?: {
         /**
          * If there is an existing version id
          */
         id?: number;
         /**
          * version name. if one is provided,`jasmine-zephyr-reporter` will search for the id.
          */
         versionName?: string;
         /**
          * If you desired for `jasmine-zephyr-reporter` to create a new version for you.
          * `jasmine-zephyr-reporter` will search first if this version name exist.
          * If not, a version with this name will create under the mention project id from above.
          */
         createNewVersion?: {
            description: string;
            name: string;
            archived: boolean;
            released: boolean;
            /**
             * Format of ISO 8601. meaning, YYYY-MM-DD format
             * If no date will be mention, `jasmine-zephyr-reporter` will create default one for today */
            releasedDate?: string;
            projectId: number;
         };
      };
      /**
       * Configuration about cycle creation. For example: Whether to create a new cycle,
       * delete old cycles or perhaps execute on an existing cycle and more.
       */
      cycleCreationConfig?: {
         /**
          * Execute test on this cycle id.
          * This will be recommended mostly in case of build time (When running the test locally).
          * In order to prevent jasmine-zephyr-reporter to create new cycle each simple run.
          * If `executeOnCycleID` is provided and `createNewCycle` set to false,
          * `jasmine-zephyr-reporter` will execute test on this cycle and will not create a new one
          */
         executeOnCycleID?: number;
         /**
          * @feature
          * Whether jasmine-zephyr-reporter will create a new cycle at the bigging of each run
          */
         createNewCycle?: {
            /**
             * @deprecated
             * @feature
             * Cycle to clone test from
             */
            clonedCycleID?: string;

            /**
             * Name of a cycle.
             * cycle name will create with a date in d/m - HH:MM format attached to it
             * @default name:`jasmine-zephyr-reporter ${utils.attachDateToName()}`
             */
            name?: string;

            /**
             * Build
             */
            build?: string;
            /**
             * Whether we run locally or on server like Bamboo | jenkins and so on
             */
            environment?: string | 'locally' | 'Bamboo' | 'jenkins';
            /**
             * Description of cycle
             * @default 'jasmine-zephyr-reporter automate cycle'
             */
            description?: string;

            /**
             * StartDate of the cycle
             * @default today in DD/MM/YY format
             */
            startDate?: string;
            /**
             * endDate of the cycle
             * @default today in DD/MM/YY format
             */
            endDate?: string;

            /**
             * versionID  is the folder connection.
             * If no version has provided, version will be provided
             * if one has found or -1.
             * @deprecated
             * @link use `versionConfiguration` key
             */
            versionId?: number | 'unknown';
         };
      };
      /**
       * @feature
       * Whether to delete old cycle.
       */
      cycleDeletionConfiguration?: {
         /**
          * If a specific cycle id was mention,Then this cycle will be deleted
          * If true, is set, `jasmine-zephyr-reporter`
          * will delete all cycles under the version id of the current cycle.
          * If no version id has mention for the current cycle, no deletion will accrue.
          */
         deleteOldCycle: boolean | number;
         /**
          * Whether to keep N cycles in history.
          * If set, `jasmine-zephyr-reporter` will delete cycles until his reaches the desired amount in history.
          * The amount of is not includes dose in `keepCycles`
          */
         keepInHistory?: number;
         /**
          * Whether to keeps some cycles alive
          * To get the cycles id,
          * go to baseUrl + '/cycle?projectId=${yourProjectID}&versionId=${yourVersionID}'
          * then filter the ones your what to keep
          */
         keepCycles?: Array<string>;
      };
      /**
       * Configuration about test execution
       */
      TestExecutionConfig?: {
         /**
          * Enabled the zephyr option of `assigneeType`. Look for more at zephyr docs.
          * @default 'assignee'
          */
         assigneeType?: string;
         /**
          * On Which jira user to assignee the test execution.
          * If no jira user is mention, the jira username on auth field,
          * will register as the executor as well.
          */
         assignee?: string;
         /**
          * Folder id. Look at zephyr docs for more info.
          * @default 1
          */
         folderId?: string;
      };
      /**
       * Configuration about test result execution
       */
      TestResultConfig?: {
         /**
          * Comment to add to each test execution result when done.
          * if no comment was mention, a default message contains the end time will be present.
          */
         comment?: string;
         /**
          * Whether to attached files to test execution.
          * `jasmine-zephyr-reporter` will attached all files that exist in the resultDir path
          */
         attachment: 'onFailure' | boolean;
      };
      /**
       * Configuration about test result execution
       */
      stepResultConfig?: {
         /**
          * Comment to add to each test execution result when done.
          * if no comment was mention, jasmine message on each step will be present
          */
         comment?: string;
         /**
          * Whether to attached files to test execution.
          * `jasmine-zephyr-reporter` will attached all files that exist in the resultDir path
          */
         attachment: 'onFailure' | boolean;
      };
   };
}

export interface HttpConfiguration {
   /**
    * `BaseUrl` contains the host of the desired url
    */
   baseUrl: string;
   /**
    * Auth contains username and password
    * password is either a real password in old jira version or api token
    */
   auth: {
      username: string;
      password: string;
   };
}

export interface axiosMethods {
   get: (url: string, config?: AxiosRequestConfig) => Promise<AxiosResponse<any>>;
   post: (
      url: string,
      body: {},
      config?: AxiosRequestConfig
   ) => Promise<AxiosResponse<any>>;
   put: (
      url: string,
      body: {},
      config?: AxiosRequestConfig
   ) => Promise<AxiosResponse<any>>;
   delete: (url: string, config?: AxiosRequestConfig) => Promise<AxiosResponse<any>>;
}
