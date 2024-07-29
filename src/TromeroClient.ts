import axios, { AxiosInstance, AxiosResponse } from 'axios';

interface TromeroAIOptions {
  apiKey: string;
  baseURL?: string;
  dataURL?: string;
}

interface ApiResponse {
  error?: string;
  status_code: string | number;
  [key: string]: any;
}

export default class TromeroClient {
  private axiosInstance: AxiosInstance;
  private dataURL: string;
  private baseURL: string;
  apiKey: string;
  modelUrls: { [key: string]: string };
  baseModel: { [key: string]: any };

  constructor({
    apiKey,
    baseURL = 'https://midyear-grid-402910.lm.r.appspot.com/tailor/v1',
    dataURL = `${baseURL}/data`,
  }: TromeroAIOptions) {
    this.apiKey = apiKey;
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
      },
    });
    this.dataURL = dataURL;
    this.baseURL = baseURL;
    this.modelUrls = {};
    this.baseModel = {};
  }

  async postData(data: any): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> =
        await this.axiosInstance.post(this.dataURL, data);
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

  async getModelUrl(modelName: string): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await axios.get(
        `${this.baseURL}/model/${modelName}/url`,
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          error: `An error occurred: ${error.message}`,
          status_code: error.response?.status.toString() ?? 'N/A',
        };
      }
      return { error: 'An unexpected error occurred', status_code: 'N/A' };
    }
  }

  mockOpenAIFormatStream(messages: string): any {
    const choice = { delta: { content: messages } };
    return { choices: [choice] };
  }

  async *streamResponse(
    response: AsyncIterable<Buffer>
  ): AsyncGenerator<any, void, unknown> {
    let lastChunk = '';

    for await (const chunk of response) {
      const chunkStr = chunk.toString('utf-8');
      const jsonStr = chunkStr.slice(5); // Adjust as necessary
      lastChunk = jsonStr;

      const pattern = /"token":({.*?})/;
      const match = pattern.exec(jsonStr);

      if (match) {
        const json = JSON.parse(match[1]);
        const formattedChunk = this.mockOpenAIFormatStream(json['text']);
        yield formattedChunk;
      } else {
        break;
      }
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
        throw new Error(`An error occurred: ${error.message}`);
      }
      throw new Error('An unknown error occurred');
    }
  }
  async createStream(
    model: string,
    modelUrl: string,
    messages: any[],
    parameters: { [key: string]: any },
    onData: (data: any) => void,
    onError: (error: Error) => void,
    onEnd: () => void
  ) {
    try {
      const response = await axios.post(
        `${modelUrl}/generate`,
        { messages, parameters, adapter_name: model },
        {
          headers: {
            'X-API-KEY': this.apiKey,
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
