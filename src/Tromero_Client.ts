import { ChatCompletionChunk } from 'openai/resources';
import { mockOpenAIFormatStream } from './tromeroUtils';

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

  mockOpenAIFormatStream(messages: string): any {
    const choice = { delta: { content: messages } };
    return { choices: [choice] };
  }

  async *streamResponse(
    response: Response
  ): AsyncGenerator<any, void, unknown> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let lastChunk = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value);
        lastChunk = chunkStr;

        const pattern = /"token":({.*?})/;
        const match = pattern.exec(chunkStr);

        if (match) {
          const json = JSON.parse(match[1]);
          const formattedChunk = this.mockOpenAIFormatStream(json['text']);
          yield formattedChunk;
        } else {
          break;
        }
      }
    }
  }

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

  // async createStream(
  //   model: string,
  //   modelUrl: string,
  //   messages: any[],
  //   parameters: { [key: string]: any },
  //   onData: (data: any) => void,
  //   onError: (error: Error) => void,
  //   onEnd: () => void
  // ) {
  //   try {
  //     const response = await fetch(`${modelUrl}/generate`, {
  //       method: 'POST',
  //       headers: {
  //         'X-API-KEY': this.apiKey,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ messages, parameters, adapter_name: model }),
  //     });

  //     const reader = response.body?.getReader();
  //     const decoder = new TextDecoder('utf-8');

  //     if (reader) {
  //       reader
  //         .read()
  //         .then(function process({ done, value }) {
  //           if (done) {
  //             onEnd();
  //             return;
  //           }

  //           const chunk = decoder.decode(value, { stream: true });
  //           onData(JSON.parse(chunk));

  //           reader.read().then(process).catch(onError);
  //         })
  //         .catch(onError);
  //     }
  //   } catch (error) {
  //     onError(error as Error);
  //   }
  // }

  // async createStream(
  //   model: string,
  //   modelUrl: string,
  //   messages: any[],
  //   parameters: { [key: string]: any },
  //   onData: (data: ChatCompletionChunk) => void,
  //   onError: (error: Error) => void,
  //   onEnd: () => void
  // ) {
  //   try {
  //     const response = await fetch(`${modelUrl}/generate_stream`, {
  //       method: 'POST',
  //       headers: {
  //         'X-API-KEY': this.apiKey,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ messages, parameters, adapter_name: model }),
  //     });

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const reader = response.body?.getReader();
  //     const decoder = new TextDecoder('utf-8');

  //     if (reader) {
  //       let buffer = '';

  //       const process = async ({
  //         done,
  //         value,
  //       }: ReadableStreamDefaultReadResult<Uint8Array>) => {
  //         if (done) {
  //           onEnd();
  //           return;
  //         }

  //         buffer += decoder.decode(value, { stream: true });
  //         const parts = buffer.split('\n');
  //         buffer = parts.pop()!; // Keep the last incomplete part in the buffer

  //         for (const part of parts) {
  //           if (part.startsWith('data:')) {
  //             try {
  //               const jsonStr = part.substring(5);
  //               const data = JSON.parse(jsonStr);
  //               if (data.token && data.token.text) {
  //                 const formattedChunk: ChatCompletionChunk = {
  //                   choices: [
  //                     {
  //                       finish_reason: null,
  //                       index: 0,
  //                       delta: {
  //                         content: data.token.text,
  //                       },
  //                     },
  //                   ],
  //                   id: '',
  //                   created: 0,
  //                   model: '',
  //                   object: 'chat.completion.chunk',
  //                 };
  //                 onData(formattedChunk);
  //               }
  //             } catch (error) {
  //               console.error('Error parsing JSON data:', error);
  //             }
  //           }
  //         }

  //         reader.read().then(process).catch(onError);
  //       };

  //       reader.read().then(process).catch(onError);
  //     } else {
  //       onEnd();
  //     }
  //   } catch (error) {
  //     onError(error as Error);
  //   }
  // }
}
