import { HTTPClient } from '../../api/axiosInstance';
import { HttpConfiguration } from '../../types';
import { resolve } from 'path';
import { promises, createReadStream } from 'fs';
import FormData from 'form-data';

const { readdir } = promises;

/** Contains jira api options for `jasmine-zephyr-reporter` */
export default class JiraService extends HTTPClient {
  // Declaration
  public data: Data;
  constructor(config: HttpConfiguration) {
    super(config);

    this.data = {
      projectId: -1,
      versionId: -1,
      sprintId: -1,
    };
  }

  // =============================== ProjectId ================================
  /**
   *
   * @param projectIdOrKey string | number
   * @returns number - project id or -1 if:
   * - `projectIdOrKey` is not typeof number | string
   * - not found id key in the response
   * - projectId.data.id is NaN
   */
  async getProjectId(projectIdOrKey: string | number): Promise<number> {
    if (typeof projectIdOrKey === 'number') return projectIdOrKey;
    if (typeof projectIdOrKey !== 'string') return -1;
    try {
      const projectId = await this.methods.get(`/api/latest/project/${projectIdOrKey}`);
      return +projectId.data.id ? projectId.data.id : -1;
    } catch (error) {
      return -1;
    }
  }

  // =============================== get sprint ================================
  /**
   *
   * @param boardId number
   * @param desiredSprintName string
   * @description search for sprint with the desired name.
   * only those who are on the active or future status.
   * @returns sprint id if found. or -1 if
   *  - `boardId` or `desiredSprintName` not provided.
   *  - if `desiredSprintName` is on a 'closed' sprint status.
   *  - if the request has failed for some reason.
   */
  async getSprintIDByName(boardId?: number, desiredSprintName?: string): Promise<number> {
    if (!boardId || !desiredSprintName) return -1;
    try {
      const response = await this.methods.get(`/agile/latest/board/${boardId}/sprint`);
      const activeSprints: any[] = response.data.values;
      // Filtering all closed sprints. keeps the future and active ones
      const sprint = activeSprints
        .filter((x: any) => x.name !== 'closed')
        .find((x: any) => x.name === desiredSprintName)['id'];
      return +sprint ? sprint : -1;
    } catch (error) {
      return -1;
    }
  }

  /**
   *
   * @param boardId number
   * @returns active sprint id or -1 if
   * - no active sprint has found
   * - `boardId` parameter is not number
   */
  async getActiveSprintID(boardId?: number): Promise<number> {
    if (!boardId || !isNaN(boardId)) return -1;
    try {
      const response = await this.methods.get(
        `/agile/latest/board/${boardId}/sprint?state=active`
      );
      return response.data.values[0] && +response.data.values[0]['id']
        ? response.data.values[0]['id']
        : -1;
    } catch (error) {
      return -1;
    }
  }

  // =============================== version ================================
  /**
   *
   * @param boardId number
   * @param desiredVersionName string
   * @returns versionId. or -1 if
   * - boardId is not a number
   * - not found version id (as number)
   * - failed with the request
   */
  async getVersionIdByName(boardId: number, desiredVersionName: string): Promise<number> {
    try {
      if (!boardId || isNaN(boardId)) return -1;
      const allVersion = await this.methods.get(`/agile/latest/board/${boardId}/version`);
      const version = allVersion.data.values.find(
        (x: any) => x.name === desiredVersionName
      );
      return version && +version.id ? version.id : -1;
    } catch (error) {
      return -1;
    }
  }

  /**
   *
   * @param data CreateVersion
   * @returns
   */
  async createVersion(data: CreateVersion): Promise<number> {
    if (!data.releasedDate) data.releasedDate = this.utils.getDateAsISO();
    try {
      const response = await this.methods.post('/api/latest/version', data);
      return +response.data.id;
    } catch (error) {
      return -1;
    }
  }

  // =============================== issues ================================
  /**
   *
   * @param issueIdOrKey string | number
   * @param desiredKey string
   * @returns value of the desiredKey of this issue. or -1 if
   * - invalid params
   * - key not found
   * - failed with the request
   */
  async getIssueKey(issueIdOrKey: string | number, desiredKey: string): Promise<number> {
    if (!issueIdOrKey || !desiredKey) return -1;
    try {
      const response = await this.methods.get(`/api/latest/issue/${issueIdOrKey}`);
      return response.data && response.data[desiredKey] ? response.data[desiredKey] : -1;
    } catch (error) {
      return -1;
    }
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
  async attachedFileToIssue(issueId: number, filesDir: string) {
    // read files name at the giving path
    const files = await readdir(filesDir /*resolve(filesDir)*/);
    for (const filename of files) {
      const path = resolve(filesDir, filename);
      // Read contact
      const file = createReadStream(path);
      const form = new FormData();
      // Convert it to form-data type (Content-Type: multipart/form-data header)
      form.append('file', file, { filename: filename });

      try {
        const response = await this.methods.post(
          `/api/latest/issue/${issueId}/attachments`,
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

type CreateVersion = {
  description: string;
  name: string;
  archived: boolean;
  released: boolean;
  // Expressed in ISO 8601 YYYY-MM-DD format
  releasedDate?: string;
  projectId: number;
};

type Data = {
  projectId: number;
  versionId: number;
  sprintId: number;
};
