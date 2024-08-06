import {
  ApiResponse,
  ChatCompletionChunkStreamClass,
  CreateApiResponse,
  Message,
  MessageParams,
  MockMessage,
  ModelData,
  TromeroCompletionParams,
  TromeroOptions,
} from './tromeroUtils';

export default class TromeroClient {
  private dataURL: string;
  private baseURL: string;
  private apiKey: string;
  modelData: ModelData;

  constructor({
    tromeroKey,
    baseURL = 'https://midyear-grid-402910.lm.r.appspot.com/tailor/v1',
    dataURL = `${baseURL}/data`,
  }: TromeroOptions) {
    this.apiKey = tromeroKey;
    this.dataURL = dataURL;
    this.baseURL = baseURL;
    this.modelData = {};
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
      if (error instanceof Response) {
        return {
          error: `An error occurred: ${error.statusText}`,
          status_code: error.status,
        };
      }
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

  async create(
    model: string,
    modelUrl: string,
    messages: Message[],
    parameters:
      | Omit<TromeroCompletionParams, 'model' | 'messages' | 'stream'>
      | {} = {}
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
            const lines = chunkStr
              .split('\n')
              .filter((line) => line.trim().length > 0);

            for (let line of lines) {
              if (line.startsWith('data:')) {
                line = line.slice(5).trim();

                try {
                  const chunkDict = JSON.parse(line);

                  if (!chunkDict || !chunkDict.token) {
                    console.error(
                      'Invalid chunkDict or token structure',
                      chunkDict
                    );
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
                } catch (jsonError) {
                  console.error(
                    'JSON parsing error:',
                    jsonError,
                    'line:',
                    line
                  );
                  continue;
                }
              }
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
