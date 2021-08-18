import { existsSync, rmSync, promises } from 'fs';
import { resolve } from 'path';
import { Configuration } from '../types';
import { ActivateConfig } from './configChecker';
import { JasmineZephyrReporterError } from './ErrorHandling';
const { readdir, rename, mkdir } = promises;

export class Utility {
   private ActivateConfig: ActivateConfig;
   constructor() {
      this.ActivateConfig = new ActivateConfig();
   }
   /**
    *
    * @returns date in DD/MMM/YY (Month as short name)
    */
   getDate(): string {
      const date = new Date();
      let response = '' + date.getDate();
      response += '/';
      response += date.toLocaleString('en-us', { month: 'short' });
      response += '/';
      response += date.getFullYear().toString().substring(2, 4);
      return response;
   }

   /** @returns date in YYYY-MM-DD format */
   getDateAsISO(): string {
      return new Date().toISOString().slice(0, 10);
   }

   conformDateFormat(date?: string) {
      if (!date) return false;
      return /^[0-9]{2}\/[A-z]{3}\/[0-9]{2}$/.test(date);
   }
   /**
    *
    * @description create name. used for cycle name if no name has been provided
    * @returns string of `jasmine-zephyr-reporter` + date
    */
   attachDateToName(): string {
      const date = new Date();
      return ` ${date.getDate()}/${
         date.getMonth() + 1
      } - ${date.getHours()}:${date.getMinutes()}`;
   }

   /**
    *
    * @param str string
    * @returns the giving `str` without the forward slash at the end
    */
   public removeSlashFromTheEnd(str: string): string {
      return str.replace(/(\/+$)|(\\+$)/, '');
   }

   public removeSlashFromTheStart(str: string): string {
      return str.replace(/(^\/+)|(^\\+)/, '');
   }

   public removeUnnecessarySlashFormUrl(url: string) {
      return url.replace(/(https?:\/\/)|(\/){2,}/g, '$1$2');
   }

   /**
    *
    * @param path
    * @param newFolderName
    * @description Move all files in a giving folder to a new folder
    * @returns path of the new folder or -1
    */
   public async copyFilesToFolder(path: string, newFolderName: string) {
      if (!existsSync(resolve(path))) return -1;
      const files = await readdir(resolve(path), { withFileTypes: true });
      // Filtering only files
      const filesName: string[] = files
         .filter((content) => content.isFile())
         .map((file) => file.name);

      if (filesName.length > 0) {
         for (const file of filesName) {
            // Create one
            if (!existsSync(resolve(path, newFolderName)))
               await mkdir(resolve(path, newFolderName), { recursive: true });
            await rename(resolve(path, file), resolve(path, newFolderName, file));
         }
         return resolve(path, newFolderName);
      }
      return -1;
   }

   /**
    *
    * @param config
    * @description activate the `configChecker` methods.
    * exit process if `breakOnBadConnectionKeys` set to true
    * @returns boolean
    */
   public requiredKeys(config: Configuration) {
      const validConfig = this.ActivateConfig.necessaryKeysExist(config);

      if (config.breakOnBadConnectionKeys && !validConfig) process.exit();
      if (!this.ActivateConfig.validUrl(config.HostUrl) || !validConfig) {
         return false;
      }
      return true;
   }

   /**
    *
    * @param resultDir
    * @description delete all files in a giving path if exist
    * @returns void
    */
   public deleteOldFiles(resultDir: string): void {
      const path = resolve(resultDir);
      if (existsSync(path)) {
         rmSync(path, { recursive: true, force: true });
      }
   }
}
