import { ChatCompletionChunkStreamClass } from './tromeroUtils';

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
  private dataURL: string;
  private baseURL: string;
  private apiKey: string;
  modelUrls: { [key: string]: string };
  baseModel: { [key: string]: any };

  constructor({
    apiKey,
    baseURL = 'https://midyear-grid-402910.lm.r.appspot.com/tailor/v1',
    dataURL = `${baseURL}/data`,
  }: TromeroAIOptions) {
    this.apiKey = apiKey;
    this.dataURL = dataURL;
    this.baseURL = baseURL;
    this.modelUrls = {};
    this.baseModel = {};
  }

  private async fetchData(
    url: string,
    options: RequestInit
  ): Promise<ApiResponse> {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error) {
      if (error instanceof Error) {
        return {
          error: `An error occurred: ${error.message}`,
          status_code: 'N/A',
        };
      }
      return {
        error: 'An error occurred',
        status_code: 'N/A',
      };
    }
  }

  async postData(data: any): Promise<ApiResponse> {
    return this.fetchData(this.dataURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
      },
      body: JSON.stringify(data),
    });
  }

  async getModelUrl(modelName: string): Promise<ApiResponse> {
    return this.fetchData(`${this.baseURL}/model/${modelName}/url`, {
      method: 'GET',
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  // mockOpenAIFormatStream(messages: string): any {
  //   const choice = { delta: { content: messages } };
  //   return { choices: [choice] };
  // }

  // async *streamResponse(
  //   response: Response
  // ): AsyncGenerator<any, void, unknown> {
  //   const reader = response.body?.getReader();
  //   const decoder = new TextDecoder('utf-8');
  //   let lastChunk = '';

  //   if (reader) {
  //     while (true) {
  //       const { done, value } = await reader.read();
  //       if (done) break;

  //       const chunkStr = decoder.decode(value);
  //       lastChunk = chunkStr;

  //       const pattern = /"token":({.*?})/;
  //       const match = pattern.exec(chunkStr);

  //       if (match) {
  //         const json = JSON.parse(match[1]);
  //         const formattedChunk = this.mockOpenAIFormatStream(json['text']);
  //         yield formattedChunk;
  //       } else {
  //         break;
  //       }
  //     }
  //   }
  // }

  async create(
    model: string,
    modelUrl: string,
    messages: any[],
    parameters: any = {}
  ) {
    const response = await this.fetchData(`${modelUrl}/generate`, {
      method: 'POST',
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ adapter_name: model, messages, parameters }),
    });

    return response;
  }

  async *createStream(
    model: string,
    modelUrl: string,
    messages: any[],
    parameters: {
      [key: string]: any;
    } = {}
  ): AsyncIterableIterator<ChatCompletionChunkStreamClass> {
    const headers = {
      'Content-Type': 'application/json',
      'X-API-KEY': this.apiKey,
    };
    const data = {
      adapter_name: model,
      messages,
      parameters,
    };

    try {
      const response = await fetch(`${modelUrl}/generate_stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (model) throw new Error('Model not found');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!(response.body instanceof ReadableStream)) {
        throw new Error('Response body is not a readable stream');
      }

      const reader = response?.body?.getReader();
      let fullText = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          let chunkStr = new TextDecoder('utf-8').decode(value);
          try {
            chunkStr = chunkStr.slice(5);
            const chunkDict = JSON.parse(chunkStr);

            if (!chunkDict || !chunkDict.token) {
              console.error('Invalid chunkDict or token structure', chunkDict);
              continue;
            }

            const responseChunk = new ChatCompletionChunkStreamClass({
              model: model,
              streamResponse: chunkDict.token.text,
              finishReason: chunkDict.token.special ? 'stop' : null,
            });

            yield responseChunk;

            const content = chunkDict.token.text;
            if (content) {
              fullText += content;
            }
          } catch (error) {
            console.error(`Error parsing JSON: ${error}`);
            continue;
          }
        }
      } finally {
        console.log('fullText', fullText);
        reader.releaseLock();
      }
    } catch (error) {
      throw error;
    }
  }
}
