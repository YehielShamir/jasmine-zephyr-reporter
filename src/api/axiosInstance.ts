import axios, {
   AxiosError,
   AxiosInstance,
   AxiosRequestConfig,
   AxiosResponse,
} from 'axios';
import { HttpConfiguration, axiosMethods } from '../types';
import { Utility } from '../utils';
import { Agent } from 'https';

export class HTTPClient {
   // Declaration
   private conf: HttpConfiguration;
   private instance: AxiosInstance;
   protected utils: Utility;

   constructor(config: HttpConfiguration) {
      this.utils = new Utility();
      this.conf = config;
      this.instance = axios.create({
         baseURL: this.utils.removeUnnecessarySlashFormUrl(config.baseUrl),
         auth: config.auth,
         headers: {
            Accept: 'application/json',
            'X-Atlassian-Token': 'no-check',
         },
         httpsAgent: new Agent({
            rejectUnauthorized: false,
         }),
         responseType: 'json',
      });

      this.initialResponseInterceptor();
   }

   protected get config(): HttpConfiguration {
      return this.conf;
   }
   protected get methods(): axiosMethods {
      const responseBody = (res: AxiosResponse) => res;

      return {
         get: (url: string, config?: AxiosRequestConfig) =>
            this.instance.get(url, config).then(responseBody),
         post: (url: string, body: {}, config?: AxiosRequestConfig) =>
            this.instance.post(url, body, config).then(responseBody),
         put: (url: string, body: {}, config?: AxiosRequestConfig) =>
            this.instance.put(url, body, config).then(responseBody),
         delete: (url: string, config?: AxiosRequestConfig) =>
            this.instance.delete(url, config).then(responseBody),
      };
   }

   private initialResponseInterceptor = () => {
      this.instance.interceptors.response.use(
         // @ts-ignore
         this._handleResponse,
         this._handlingError
      );
   };
   private _handleResponse = ({ status, data }: AxiosResponse) => {
      return { status, data };
   };

   private _handlingError = (error: AxiosError) => {
      return Promise.reject({
         config: {
            url: error.config.url,
            auth: error.config.auth,
            headers: error.config.headers,
         },
         response: {
            status:
               (error.response && error.response.status) || 'status can be not found',
            statusText:
               (error.response && error.response.statusText) ||
               'status text can be not found',
         },
         data: (error.response && error.response.data) || 'data can not be found',
         message:
            (error.response && error.response.request.res.message) ||
            'message can not be found',
         isAxiosError: error.isAxiosError,
      });
   };
}
