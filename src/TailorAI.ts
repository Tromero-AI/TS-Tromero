import {
  ChatCompletion,
  ChatCompletionCreateParams,
  ChatCompletionChunk,
} from 'openai/resources';
import { Stream } from 'openai/src/streaming';
import OpenAI, { ClientOptions } from 'openai';
import { Chat, Completions } from 'openai/resources/chat';
import { RequestOptions, APIPromise } from 'openai/core';
import { TromeroAI } from './TromeroAI';
import { getModelUrl } from './tromeroRequests';
import { Choice, Message, mockOpenAIFormat } from './tromeroUtils';

interface TailorAIOptions extends ClientOptions {
  apiKey: string;
  tromeroKey: string;
  saveData?: boolean;
}

class MockCompletions extends Completions {
  _client: TailorAI;

  constructor(client: TailorAI) {
    super(client);
    this._client = client;
  }

  private choiceToDict(choice: Choice): Choice {
    return {
      message: {
        content: choice.message.content,
        role: choice.message.role,
      },
    };
  }

  private saveData(data: any): void {
    if (this._client.saveData) {
      setTimeout(() => this._client.tromeroClient.postData(data), 0);
    }
  }

  private async formatKwargs(kwargs: {
    [key: string]: any;
  }): Promise<{ [key: string]: string | number }> {
    const keysToKeep = [
      'best_of',
      'decoder_input_details',
      'details',
      'do_sample',
      'max_new_tokens',
      'ignore_eos_token',
      'repetition_penalty',
      'return_full_outcome',
      'seed',
      'stop',
      'temperature',
      'top_k',
      'top_p',
      'truncate',
      'typical_p',
      'watermark',
      'schema',
      'adapter_id',
      'adapter_source',
      'merged_adapters',
      'response_format',
    ];

    const additionalKeys = [
      'tags',
      'model',
      'messages',
      'use_fallback',
      'fallback_model',
      'stream',
    ];

    const validKeys = new Set([...keysToKeep, ...additionalKeys]);
    const formattedKwargs: { [key: string]: any } = {};

    let invalidKeyFound = false;

    for (const key in kwargs) {
      if (validKeys.has(key)) {
        formattedKwargs[key] = kwargs[key];
      } else {
        console.warn(
          `Warning: ${key} is not a valid parameter for the model. This parameter will be ignored.`
        );
        invalidKeyFound = true;
      }
    }

    if (invalidKeyFound) {
      console.log(
        'The following parameters are valid for the model: ',
        keysToKeep.join(', ')
      );
    }

    return formattedKwargs;
  }

  private formatMessages(messages: Message[]): Message[] {
    let systemPrompt = '';
    let numPrompts = 0;

    for (const message of messages) {
      if (message.role === 'system') {
        systemPrompt += message.content + ' ';
        numPrompts += 1;
      } else {
        break;
      }
    }

    if (numPrompts <= 1) {
      return messages;
    }

    const combinedMessage: Message = {
      role: 'system',
      content: systemPrompt.trim(),
    };
    const remainingMessages = messages.slice(numPrompts);

    console.warn(
      'Warning: Multiple system prompts will be combined into one prompt when saving data or calling custom models.'
    );

    return [combinedMessage, ...remainingMessages];
  }

  async isModelFromOpenAi(model: string): Promise<boolean> {
    try {
      const models = await this._client.openAiClient.models.list();
      const modelNames = models.data.map((m: any) => m.id);
      return modelNames.includes(model);
    } catch (error) {
      console.warn("Error in retrieving OpenAi's model list");
      return false;
    }
  }
  create(
    body: ChatCompletionCreateParams,
    options?: RequestOptions
  ): APIPromise<ChatCompletion> | APIPromise<Stream<ChatCompletionChunk>> {
    return new APIPromise(async (resolve, reject) => {
      try {
        const {
          model,
          stream,
          use_fallback = true,
          fallback_model = '',
          ...kwargs
        } = body as any;
        const messages = this.formatMessages(kwargs.messages);
        const formattedKwargs = await this.formatKwargs(kwargs);

        let isOpenAiModel = await this.isModelFromOpenAi(model);
        if (isOpenAiModel) {
          const openai_kwargs = { ...kwargs, messages };
          const res = await super.create(openai_kwargs, options);
          this.saveData({ messages, model, ...openai_kwargs });
          resolve(res);
        } else {
          if (!(model in this._client.modelUrls)) {
            const { url, baseModel } = await getModelUrl(
              model,
              this._client.tromeroKey
            );
            this._client.modelUrls[model] = url;
            this._client.isBaseModel[model] = baseModel;
          }

          const model_request_name = this._client.isBaseModel[model]
            ? 'NO_ADAPTER'
            : model;
          let res;

          if (stream) {
            const onData = (data: any) => {
              resolve(data);
            };
            const onError = (error: Error) => {
              reject(error);
            };
            const onEnd = () => {};

            this._client.tromeroClient.createStream(
              model_request_name,
              this._client.modelUrls[model],
              messages,
              this._client.tromeroKey,
              formattedKwargs,
              onData,
              onError,
              onEnd
            );
          } else {
            res = await this._client.tromeroClient.create(
              model_request_name,
              this._client.modelUrls[model],
              messages,
              this._client.tromeroKey,
              formattedKwargs
            );

            if (res.generated_text) {
              res = mockOpenAIFormat(res.generated_text);
            }
            this.saveData({ messages, model, ...formattedKwargs });
            resolve(res);
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}

class MockChat extends Chat {
  public completions: Completions;

  constructor(client: any) {
    super(client);
    this.completions = new MockCompletions(client);
  }
}

class TailorAI extends OpenAI {
  tromeroClient: TromeroAI;
  openAiClient: OpenAI;
  tromeroKey: string;
  saveData: boolean;
  modelUrls: { [key: string]: string };
  isBaseModel: { [key: string]: boolean };
  chat: MockChat;

  constructor({
    apiKey,
    tromeroKey,
    saveData = true,
    ...opts
  }: TailorAIOptions) {
    super({ apiKey, ...opts });
    this.tromeroClient = new TromeroAI({ apiKey: tromeroKey });
    this.openAiClient = new OpenAI({ apiKey });
    this.tromeroKey = tromeroKey;
    this.saveData = saveData;
    this.modelUrls = {};
    this.isBaseModel = {};
    this.chat = new MockChat(this);

    // Override the completions.create method
    //   const originalCreate = this.chat.completions.create.bind(this);
    //   this.chat.completions.create = async (
    //     body: ChatCompletionCreateParams,
    //     options?: RequestOptions
    //   ) => this.createCompletion(body, originalCreate, options);
    // }

    // async createCompletion(
    //   body: ChatCompletionCreateParams,
    //   originalCreate: (
    //     body: ChatCompletionCreateParams,
    //     options?: RequestOptions
    //   ) => Promise<ChatCompletion | Stream<ChatCompletionChunk>>,
    //   options?: RequestOptions
    // ): Promise<ChatCompletion | Stream<ChatCompletionChunk> | unknown> {
    //   const model = body.model;

    //   if (await this.isModelFromOpenAi(model)) {
    //     const completion = originalCreate(
    //       body as ChatCompletionCreateParams,
    //       options
    //     );

    //     if (this.saveData) {
    //       await postData(completion, this.tromeroKey);
    //     }

    //     return completion;
    //   } else {
    //     const completion = await this.tromeroClient.MockCompletions(
    //       body as TromeroChatCompletionCreateParams,
    //       options
    //     );

    //     return mockOpenAIFormat(completion);
    //   }
  }
}

export default TailorAI;
