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
/**
 * 
 *  protected get methods() {
    const responseBody = (response: AxiosResponse) => response;

    const requestType =  {
      get: (url: string, config?: AxiosRequestConfig) =>
        this.instance.get(url, config).then(responseBody),
      post: (url: string, body: {}, config?: AxiosRequestConfig) =>
        this.instance.post(url, body, config).then(responseBody),
      put: (url: string, body: {}, config?: AxiosRequestConfig) =>
        this.instance.put(url, body, config).then(responseBody),
      delete: (url: string, config?: AxiosRequestConfig) =>
        this.instance.delete(url, config).then(responseBody),
    };
    return {
        get: (url: string,config?: AxiosRequestConfig) => this.f(this.instance,'get',...[url, config])
    }

  }
  
  private async f (re: axiosMethods, method: 'get' | 'post' | 'put' | 'delete' , ...args: any) {
    const responseBody = (response: AxiosResponse) => response;
      try {
          // @ts-ignore
          const res = re[method].apply(this,args).then(responseBody); 
          return res;
      } catch (err) {
          if(err.isAxiosError) {
             return err; 
          }
      }
  }
 */
