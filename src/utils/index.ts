import { Configuration } from '../types';
import { ActivateConfig } from './configChecker';
import { FSystem } from './FSystem';
import { JasmineZephyrReporterError } from './ErrorHandling';

export class Utility {
  private ActivateConfig: ActivateConfig;
  public fs: FSystem;

  constructor() {
    this.ActivateConfig = new ActivateConfig();
    this.fs = new FSystem();
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
}
