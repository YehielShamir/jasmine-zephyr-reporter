/** `jasmine-zephyr-reporter` error's handler */
import { Configuration } from '../types';

export class JasmineZephyrReporterError extends Error {
  constructor(private config: Configuration, message: string, args?: any) {
    super(message);
    if (args) this.message += ' ' + args;
    this.name = this.constructor.name;
    config.errorHandling === 'log'
      ? console.log(
          this.colors.Blue +
            this.name +
            ': ' +
            this.colors.Red +
            this.message +
            this.colors.White
        )
      : // config.errorHandling === 'ErrorInfo' ?
        // console.error(this.colors.Blue + this.name + ': '+ this.colors.Red + this.message + this.colors.White + `\n${this.stack}`):
        void 0;
  }

  get colors() {
    return {
      Red: '\x1b[31m',
      Blue: '\x1b[34m',
      White: '\x1b[37m',
    };
  }
}
