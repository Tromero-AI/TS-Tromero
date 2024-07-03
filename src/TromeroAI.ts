import axios, { AxiosInstance, AxiosResponse } from 'axios';

interface TromeroAIOptions {
  apiKey: string;
  baseURL?: string;
  dataUrl?: string;
}

interface ApiResponse {
  error?: string;
  status_code: string | number;
  [key: string]: any;
}

class TromeroAI {
  private axiosInstance: AxiosInstance;
  private apiKey: string;
  private dataUrl: string;
  private baseURL: string;

  constructor({
    apiKey,
    baseURL = 'https://midyear-grid-402910.lm.r.appspot.com/tailor/v1',
    dataUrl = `${baseURL}/data`,
  }: TromeroAIOptions) {
    this.apiKey = apiKey;
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
      },
    });
    this.dataUrl = dataUrl;
    this.baseURL = baseURL;
  }

  async postData(data: any): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> =
        await this.axiosInstance.post(this.dataUrl, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response ? error.response.status : 'N/A';
        return {
          error: `An error occurred: ${error.message}`,
          status_code: statusCode,
        };
      }
      return { error: 'An unknown error occurred', status_code: 'N/A' };
    }
  }

  async create(
    model: string,
    modelUrl: string,
    messages: any[],
    tromeroKey: string,
    parameters: any = {}
  ): Promise<ApiResponse> {
    const headers = {
      'X-API-KEY': tromeroKey,
      'Content-Type': 'application/json',
    };

    const data = {
      adapter_name: model,
      messages: messages,
      parameters: parameters,
    };

    try {
      const response: AxiosResponse<ApiResponse> = await axios.post(
        `${modelUrl}/generate`,
        data,
        { headers }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response ? error.response.status : 'N/A';
        return {
          error: `An error occurred: ${error.message}`,
          status_code: statusCode,
        };
      }
      return { error: 'An unknown error occurred', status_code: 'N/A' };
    }
  }
  async createStream(
    model: string,
    modelUrl: string,
    messages: any[],
    tromeroKey: string,
    parameters: any,
    onData: (data: any) => void,
    onError: (error: Error) => void,
    onEnd: () => void
  ) {
    try {
      const response = await axios.post(
        `${modelUrl}/generate`,
        { messages, parameters },
        {
          headers: {
            'X-API-KEY': tromeroKey,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        }
      );

      response.data.on('data', (chunk: Buffer) => {
        const parsedChunk = JSON.parse(chunk.toString());
        onData(parsedChunk);
      });

      response.data.on('end', () => {
        onEnd();
      });

      response.data.on('error', (err: Error) => {
        onError(err);
      });
    } catch (error) {
      onError(error as Error);
    }
  }
}

export { TromeroAI };
