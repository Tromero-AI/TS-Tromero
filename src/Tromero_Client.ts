import {
  ApiResponse,
  ChatCompletionChunkStreamClass,
  Message,
  ModelData,
  TromeroAIOptions,
} from './tromeroUtils';

/**
 * TromeroClient is a class that allows you to interact with the Tromero API.
 * It provides methods to create completions and streams of completions.
 * @param apiKey: The API key to authenticate with the Tromero API.
 * @param baseURL: The base URL of the Tromero API.
 * @param dataURL: The URL to send data to the Tromero API.
 * @param modelUrls: A dictionary of model names to their respective URLs (so you don't have to fetch them each time).
 * @param baseModel: A dictionary of model names to their respective base models (so you don't have to fetch them each time).
 * @returns A new TromeroClient instance.
 */
export default class TromeroClient {
  private dataURL: string;
  private baseURL: string;
  private apiKey: string;
  // modelUrls: { [key: string]: string };
  // baseModel: { [key: string]: any };
  modelData: ModelData;

  constructor({
    apiKey,
    baseURL = 'https://midyear-grid-402910.lm.r.appspot.com/tailor/v1',
    dataURL = `${baseURL}/data`,
  }: TromeroAIOptions) {
    this.apiKey = apiKey;
    this.dataURL = dataURL;
    this.baseURL = baseURL;
    // this.modelUrls = {};
    // this.baseModel = {};
    this.modelData = {};
  }

  /**
   * Fetches data from the given URL and returns it as a JSON object.
   * @param url
   * @param options
   * @returns The response data as a JSON object.
   */
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
      if (error instanceof Response) {
        return {
          error: `An error occurred: ${error.statusText}`,
          status_code: error.status,
        };
      }
      if (error instanceof Error) {
        return {
          error: `An error occurred: ${error.message}`,
          status_code: '',
        };
      }
      return {
        error: 'An error occurred',
        status_code: '',
      };
    }
  }

  /**
   * Endpoint to send data to the Tromero API.
   * @param url
   * @param options
   * @returns The response data as a JSON object.
   */
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

  /**
   * Endpoint to get the URL of a model.
   * @param modelName
   * @returns The response data as a JSON object.
   * @throws An error if the request fails.
   * @throws An error if the response is not JSON.
   */
  async getModelUrl(modelName: string): Promise<ApiResponse> {
    return this.fetchData(`${this.baseURL}/model/${modelName}/url`, {
      method: 'GET',
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async create(
    model: string,
    modelUrl: string,
    messages: Message[],
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

  /**
   * Creates a stream of completions from the Tromero API.
   * @param model - The model to use for the completions.
   * @param modelUrl - The URL of the model.
   * @param messages - The messages to send to the model.
   * @param parameters - The parameters to send to the model.
   * @param callback - A callback function to call after each completion.
   * @returns An async iterable of completion chunks.
   */
  async *createStream(
    model: string,
    modelUrl: string,
    messages: Message[],
    parameters: {
      [key: string]: any;
    } = {},
    callback?: (saveData: boolean, dataToSend: any) => Promise<string>
  ): AsyncIterableIterator<ChatCompletionChunkStreamClass> {
    const headers = {
      'Content-Type': 'application/json',
      'X-API-KEY': this.apiKey,
    };
    const data = {
      adapter_name: model,
      messages,
      parameters: parameters.saveData ? parameters.kwargs : parameters,
    };

    try {
      const response = await fetch(`${modelUrl}/generate_stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

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
            yield new ChatCompletionChunkStreamClass({
              model: model,
              streamResponse: chunkStr,
              finishReason: 'stop',
            });
            continue;
          }
        }
      } finally {
        reader.releaseLock();
        if (callback && parameters.saveData) {
          await callback(true, {
            messages: messages.concat([
              { role: 'assistant', content: fullText },
            ]),
            model: parameters.model,
            kwargs: parameters.kwargs,
            creation_time: new Date().toISOString(),
            tags: parameters.tags,
          });
        }
      }
    } catch (error) {
      throw error;
    }
  }
}
