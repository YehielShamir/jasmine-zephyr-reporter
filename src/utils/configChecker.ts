/** `jasmine-zephyr-reporter` verification  */
import { Configuration } from '../types';

export class ActivateConfig {
  /**
   * @description Conform the necessary keys for `jasmine-zephyr-reporter` to work.
   *
   */
  public necessaryKeysExist(config: Configuration) {
    let validKeys = true;
    const requiredKeys = [
      'HostUrl' /*'JiraHostUrl', 'ZephyrHostUrl'*/,
      'auth',
      'projectIdOrKey',
    ];

    // Verify required keys
    requiredKeys
      .filter((option) => {
        if (option === 'auth') {
          return !(
            config.hasOwnProperty('auth') &&
            config['auth']['username'] &&
            config['auth']['password']
          );
        }

        return !(config.hasOwnProperty(option) && (config as any)[option]);
      })
      .forEach((key) => {
        console.error(
          new Error(
            '\x1b[31m' +
              `-->> '${key}' value is essential for 'Jasmine_Zephyr_Reporter' and require in order to initial the reporter <<--` +
              '\x1b[37m'
          )
        );
        validKeys = false;
      });
    return validKeys;
  }

  /**
   * @param {string} url
   * @description Whether url is valid or not
   * @returns boolean
   */
  public validUrl(url: string) {
    // Verify valid url
    if (/http/.test(url)) return true;
    console.error(
      new Error(
        `${'\x1b[31m'}-->> ${url}'s value is not a valid url. missing http/s protocol`
      )
    );
    return false;
  }
}
