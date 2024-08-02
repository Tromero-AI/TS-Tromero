import * as openai from 'openai';
import * as Core from 'openai/core';
import type { Stream } from 'openai/streaming';
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParams,
  ChatCompletionCreateParamsBase,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
} from 'openai/resources/chat/completions';
import {
  ChatCompletionChunkStreamClass,
  Choice,
  Message,
  mockOpenAIFormat,
  Response,
  TromeroCompletionArgs,
} from './tromeroUtils';
import { MockStream } from './openai/streaming';
import TromeroClient from './Tromero_Client';

interface TromeroOptions extends openai.ClientOptions {
  apiKey?: string;
  tromeroKey?: string;
  saveData?: boolean;
}

export default class Tromero extends openai.OpenAI {
  public tromeroClient?: TromeroClient;

  constructor({ tromeroKey, apiKey, ...opts }: TromeroOptions) {
    super({ apiKey, ...opts });

    if (tromeroKey) {
      const tromeroClient = new TromeroClient({ apiKey: tromeroKey });
      this.chat.setClient(tromeroClient);
    } else {
      if (apiKey) {
        console.warn(
          "You're using the Tromero client without an OpenAI API key. You won't be able to use OpenAI models."
        );
      } else {
        console.warn(
          "You haven't set an apiKey for OpenAI or a tromeroKey for Tromero. Please set one of these to use the client."
        );
      }
    }
  }

  chat: MockChat = new MockChat(this);
}

class MockChat extends openai.OpenAI.Chat {
  completions: MockCompletions;

  constructor(client: openai.OpenAI) {
    super(client);
    this.completions = new MockCompletions(client);
  }

  setClient(client: TromeroClient) {
    this.completions.setTromeroClient(client);
  }
}

class MockCompletions extends openai.OpenAI.Chat.Completions {
  tromeroClient?: TromeroClient;

  constructor(client: openai.OpenAI) {
    super(client);
  }

  setTromeroClient(client: TromeroClient) {
    this.tromeroClient = client;
  }

  private choiceToObject(choice: Choice): Choice {
    return {
      message: {
        content: choice.message.content,
        role: choice.message.role,
      },
      finish_reason: choice.finish_reason || 'stop',
      index: choice.index || 0,
      logprobs: choice.logprobs || null,
    };
  }

  private async saveDataOnServer(
    saveData: boolean,
    data: any
  ): Promise<string> {
    try {
      if (saveData && this.tromeroClient) {
        setTimeout(() => this.tromeroClient!.postData(data), 0);
      }
    } catch (error) {}
    return '';
  }

  private async formatParams(kwargs: { [key: string]: any }): Promise<{
    formattedParams: { [key: string]: any };
    openAiParams: { [key: string]: any };
  }> {
    const keysToKeep = [
      'best_of',
      'decoder_input_details',
      'details',
      'do_sample',
      'max_tokens',
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
      'fallbackModel',
      'stream',
    ];

    const validKeys = new Set([...keysToKeep, ...additionalKeys]);
    const formattedParams: { [key: string]: any } = {};
    const openAiParams: { [key: string]: any } = {};

    let invalidKeyFound = false;

    for (const key in kwargs) {
      if (validKeys.has(key)) {
        formattedParams[key] = kwargs[key];
      } else {
        console.warn(
          `Warning: ${key} is not a valid parameter for the model. This parameter will be ignored.`
        );
        invalidKeyFound = true;
      }

      if (keysToKeep.includes(key)) {
        openAiParams[key] = kwargs[key];
      }
    }

    if (invalidKeyFound) {
      console.log(
        'The following parameters are valid for the model: ',
        keysToKeep.join(', ')
      );
    }
    return { formattedParams, openAiParams };
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

  private async isModelFromOpenAi(model: string): Promise<boolean> {
    try {
      const models = await this._client.models.list();
      const modelNames = models.data.map((m: any) => m.id);
      return modelNames.includes(model);
    } catch (error) {
      return false;
    }
  }

  _create(
    body: ChatCompletionCreateParamsNonStreaming,
    options?: Core.RequestOptions
  ): Core.APIPromise<ChatCompletion>;
  _create(
    body: ChatCompletionCreateParamsStreaming,
    options?: Core.RequestOptions
  ): Core.APIPromise<Stream<ChatCompletionChunk>>;
  _create(
    body: ChatCompletionCreateParams,
    options?: Core.RequestOptions
  ): Core.APIPromise<ChatCompletion | Stream<ChatCompletionChunk>> {
    let resp: Core.APIPromise<ChatCompletion | Stream<ChatCompletionChunk>>;
    resp = body.stream
      ? super.create(body, options)
      : super.create(body, options);
    return resp;
  }

  create(
    body: ChatCompletionCreateParamsNonStreaming & TromeroCompletionArgs,
    options?: Core.RequestOptions
  ): Core.APIPromise<ChatCompletion>;
  create(
    body: ChatCompletionCreateParamsStreaming & TromeroCompletionArgs,
    options?: Core.RequestOptions
  ): Core.APIPromise<MockStream>;
  create(
    body: ChatCompletionCreateParamsBase & TromeroCompletionArgs,
    options?: Core.RequestOptions
  ): Core.APIPromise<Stream<ChatCompletionChunk> | ChatCompletion>;
  async create(
    {
      saveData,
      tags,
      ...body
    }: ChatCompletionCreateParams & TromeroCompletionArgs,
    options?: Core.RequestOptions
  ): Promise<
    | ChatCompletion
    | MockStream
    | Stream<ChatCompletionChunk>
    | Response
    | AsyncIterableIterator<ChatCompletionChunkStreamClass>
    | undefined
  > {
    const {
      model,
      use_fallback = true,
      fallbackModel = '',
      ...kwargs
    } = body as any;
    const messages = this.formatMessages(kwargs.messages);
    const { formattedParams, openAiParams } = await this.formatParams(kwargs);

    let isOpenAiModel = await this.isModelFromOpenAi(model);

    let res:
      | ChatCompletion
      | Stream<ChatCompletionChunk>
      | MockStream
      | Response
      | AsyncIterableIterator<ChatCompletionChunkStreamClass>
      | undefined;

    let modelForLogs = model;

    if (isOpenAiModel) {
      try {
        if (body.stream) {
          res = await this._create(body, options);
          try {
            return new MockStream(res, (response): Promise<string> => {
              if (!saveData) return Promise.resolve('');
              const dataToSend = {
                messages: [...messages, response?.choices[0].message],
                model: modelForLogs,
                kwargs: openAiParams,
                creation_time: new Date().toISOString(),
                tags: Array.isArray(tags)
                  ? tags.join(', ')
                  : typeof tags === 'string'
                  ? tags
                  : '',
              };
              return this.saveDataOnServer(saveData, dataToSend);
            });
          } catch (e) {
            console.error('Tromero: error creating Mock stream');
            console.error(e);
            throw e;
          }
        } else {
          res = await this._create(body, options);
          if (res.choices) {
            for (const choice of res.choices) {
              const formattedChoice = this.choiceToObject(choice);
              if (saveData) {
                this.saveDataOnServer(saveData, {
                  messages: messages.concat([formattedChoice.message]),
                  model: modelForLogs,
                  kwargs: openAiParams,
                  creation_time: new Date().toISOString(),
                  tags: Array.isArray(tags)
                    ? tags.join(', ')
                    : typeof tags === 'string'
                    ? tags
                    : '',
                });
              }
            }
          }
          return res;
        }
      } catch (error: unknown) {
        if (error instanceof openai.APIError) {
          const rawMessage = error.message as string | string[];
          const message = Array.isArray(rawMessage)
            ? rawMessage.join(', ')
            : rawMessage;
          console.warn('Error in create: ', message);
          throw error;
        }
      }
    } else if (this.tromeroClient) {
      if (!(model in this.tromeroClient.modelUrls)) {
        const { url, baseModel } = await this.tromeroClient.getModelUrl(model);
        this.tromeroClient.modelUrls[model] = url;
        this.tromeroClient.baseModel[model] = baseModel;
      }

      const modelRequestName = this.tromeroClient.baseModel[model]
        ? 'NO_ADAPTER'
        : model;

      if (body.stream) {
        try {
          const callback = this.saveDataOnServer.bind(this);
          const resp = this.tromeroClient.createStream(
            modelRequestName,
            this.tromeroClient.modelUrls[model],
            messages,
            saveData
              ? {
                  ...openAiParams,
                  saveData,
                  kwargs: openAiParams,
                  tags: Array.isArray(tags)
                    ? tags.join(', ')
                    : typeof tags === 'string'
                    ? tags
                    : '',
                }
              : openAiParams,
            callback
          );

          if (!resp || !resp[Symbol.asyncIterator]) {
            throw new Error('Stream not created using fallback if exists');
          }

          // catch errors in the stream
          try {
            await resp.next();
          } catch (err) {
            throw err;
          }

          // if save data is true, save the data
          return resp;
        } catch (e) {
          if (use_fallback && fallbackModel) {
            modelForLogs = fallbackModel;
            const modifiedBody = {
              ...body,
              model: fallbackModel,
            };
            delete modifiedBody.fallbackModel;
            res = await this._create(
              modifiedBody as ChatCompletionCreateParamsStreaming,
              options
            );
            return new MockStream(res, (response): Promise<string> => {
              if (!saveData) return Promise.resolve('');
              const dataToSend = {
                messages: [...messages, response?.choices[0].message],
                model: modelForLogs,
                kwargs: openAiParams,
                creation_time: new Date().toISOString(),
                tags: Array.isArray(tags)
                  ? tags.join(', ')
                  : typeof tags === 'string'
                  ? tags
                  : '',
              };
              return this.saveDataOnServer(saveData, dataToSend);
            });
          } else {
            return Promise.reject(
              'Error creating stream, you may need to use a fallback model'
            );
          }
        }
      } else {
        try {
          const response = await this.tromeroClient.create(
            modelRequestName,
            this.tromeroClient.modelUrls[model],
            messages,
            openAiParams
          );
          if (response.generated_text && response.usage) {
            res = mockOpenAIFormat(
              response.generated_text,
              modelRequestName,
              response.usage
            );
          }
        } catch (error) {
          if (use_fallback && fallbackModel) {
            modelForLogs = fallbackModel;
            const modifiedBody = {
              ...body,
              model: fallbackModel,
            };
            delete modifiedBody.fallbackModel;
            res = await this._create(
              modifiedBody as ChatCompletionCreateParamsNonStreaming,
              options
            );
          }
        }
        if (res && 'choices' in res) {
          console.log('res.choices', res.choices);
          for (const choice of res.choices) {
            const formattedChoice = this.choiceToObject(choice);
            console.log('formattedChoice', formattedChoice);
            if (saveData) {
              const dataToSend = {
                messages: messages.concat([formattedChoice.message]),
                model: modelForLogs,
                kwargs: openAiParams,
                creation_time: new Date().toISOString(),
                tags: Array.isArray(tags)
                  ? tags.join(', ')
                  : typeof tags === 'string'
                  ? tags
                  : '',
              };
              this.saveDataOnServer(saveData, dataToSend);
            }
          }
        }
        return res;
      }
    } else {
      return Promise.reject(
        'Error: Tromero client not set. Please set the client before calling create.'
      );
    }
  }
}
