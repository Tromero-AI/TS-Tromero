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
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
} from 'openai/resources/chat/completions';
import {
  ChatCompletionChunkStreamClass,
  mockOpenAIFormat,
  MockChatCompletion,
  TromeroArgs,
  ModelDataDetails,
  TromeroCompletionParams,
} from './tromeroUtils';
import { MockStream } from './openai/streaming';
import TromeroClient from './Tromero_Client';

interface TromeroOptions extends openai.ClientOptions {
  apiKey?: string;
  tromeroKey?: string;
}

/**
 * The Tromero client.
 * @extends OpenAI
 * @param tromeroKey - The API key for the Tromero API.
 * @param apiKey - The API key for the OpenAI API.
 * @param saveData - Whether to save the data to the server.
 * @param opts - The options to pass to the OpenAI client.
 * @returns The Tromero client.
 */
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

/**
 * A mock chat class that uses the Tromero client.
 * @param client - The OpenAI client.
 * @returns The mock chat class.
 */
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

/**
 * A mock completions class that uses the Tromero client.
 * @param client - The OpenAI client.
 * @returns The mock completions class.
 */
class MockCompletions extends openai.OpenAI.Chat.Completions {
  tromeroClient?: TromeroClient;

  constructor(client: openai.OpenAI) {
    super(client);
  }

  setTromeroClient(client: TromeroClient) {
    this.tromeroClient = client;
  }

  private async isModelFromOpenAI(model: string): Promise<boolean> {
    const data = await this._client.models.list();

    const models: string[] = data.data
      .map((model: { id: string }): string | null =>
        model.id.includes('gpt') && !model.id.includes('gpt-3.5-turbo-instruct')
          ? model.id
          : null
      )
      .filter((model: string | null): model is string => model !== null);

    return models.includes(model);
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

  /**
   * Formats the parameters for the model. by keeping only the valid parameters for the model (if it's an OpenAI model it will keep only the OpenAI parameters and if it's a Tromero model it will keep only the Tromero parameters).
   * @param kwargs - The parameters to format.
   * @param isOpenAiModel - Whether the model is an OpenAI model.
   * @returns - a tuple with the formatted parameters and the settings.
   */
  private async formatParams(
    kwargs: { [key: string]: any },
    isOpenAIModel: boolean
  ): Promise<
    [ChatCompletionCreateParamsBase | TromeroCompletionParams, TromeroArgs]
  > {
    const validOpenAiKeys = new Set([
      'messages',
      'model',
      'frequency_penalty',
      'function_call',
      'functions',
      'logit_bias',
      'logprobs',
      'max_tokens',
      'n',
      'parallel_tool_calls',
      'presence_penalty',
      'response_format',
      'seed',
      'service_tier',
      'stop',
      'stream',
      'stream_options',
      'temperature',
      'tool_choice',
      'tools',
      'top_logprobs',
      'top_p',
      'user',
    ]);

    const validTromeroKeys = new Set([
      'messages',
      'model',
      'best_of',
      'presence_penalty',
      'frequency_penalty',
      'repetition_penalty',
      'temperature',
      'top_p',
      'top_k',
      'seed',
      'use_beam_search',
      'length_penalty',
      'early_stopping',
      'stop',
      'stop_token_ids',
      'include_stop_str_in_output',
      'ignore_eos',
      'max_tokens',
      'min_tokens',
      'logprobs',
      'prompt_logprobs',
      'detokenize',
      'skip_special_tokens',
      'spaces_between_special_tokens',
      'logits_processors',
      'truncate_prompt_tokens',
      'stream',
    ]);

    const validExtraKeys = new Set([
      'useFallback',
      'fallbackModel',
      'tags',
      'saveData',
    ]);

    const tromeroParams: TromeroCompletionParams = { model: '', messages: [] };
    const openAiParams: ChatCompletionCreateParamsBase = {
      model: '',
      messages: [],
    };
    const settings: TromeroArgs = {};

    let invalidKeyFound = false;

    for (const key in kwargs) {
      if (isOpenAIModel) {
        if (validOpenAiKeys.has(key)) {
          (openAiParams as any)[key] = kwargs[key];
        } else {
          console.warn(
            `Warning: ${key} is not a valid parameter for OpenAI models. This parameter will be ignored.`
          );
          invalidKeyFound = true;
        }
      } else {
        if (validTromeroKeys.has(key)) {
          (tromeroParams as any)[key] = kwargs[key];
        } else {
          console.warn(
            `Warning: ${key} is not a valid parameter for models fine-tuned in Tromero. This parameter will be ignored.`
          );
          invalidKeyFound = true;
        }
      }
      if (validExtraKeys.has(key)) {
        (settings as any)[key] = kwargs[key];
      }
    }

    if (invalidKeyFound) {
      console.warn(
        'For your reference, only the following parameters are valid based on your model: ',
        isOpenAIModel
          ? Array.from(validOpenAiKeys).join(', ')
          : Array.from(validTromeroKeys).join(', ')
      );
    }
    return [isOpenAIModel ? openAiParams : tromeroParams, settings];
  }

  private formatMessages(
    messages: ChatCompletionMessageParam[]
  ): ChatCompletionMessageParam[] {
    let numPrompts = 0;
    let systemPrompt = '';

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

    const combinedMessage: ChatCompletionSystemMessageParam = {
      role: 'system' as const,
      content: systemPrompt.trim(),
    };
    const remainingMessages = messages.slice(numPrompts);

    console.warn(
      'Warning: Multiple system prompts will be combined into one prompt when saving data or calling custom models.'
    );

    return [combinedMessage, ...remainingMessages];
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
    resp = super.create(body, options);
    return resp;
  }

  create(
    body: ChatCompletionCreateParamsNonStreaming &
      TromeroCompletionParams &
      TromeroArgs,
    options?: Core.RequestOptions
  ): Core.APIPromise<ChatCompletion>;
  create(
    body: ChatCompletionCreateParamsStreaming &
      TromeroCompletionParams &
      TromeroArgs,
    options?: Core.RequestOptions
  ): Core.APIPromise<MockStream>;
  create(
    body: ChatCompletionCreateParamsBase &
      TromeroCompletionParams &
      TromeroArgs,
    options?: Core.RequestOptions
  ): Core.APIPromise<Stream<ChatCompletionChunk> | ChatCompletion>;
  async create(
    body: ChatCompletionCreateParams & TromeroCompletionParams & TromeroArgs,
    options?: Core.RequestOptions
  ): Promise<
    | ChatCompletion
    | MockStream
    | Stream<ChatCompletionChunk>
    | MockChatCompletion
    | AsyncIterableIterator<ChatCompletionChunkStreamClass>
    | undefined
    | Error
  > {
    return await this.handleChatCompletion(body, options);
  }

  async handleChatCompletion(
    body: ChatCompletionCreateParams & TromeroCompletionParams & TromeroArgs,
    options?: Core.RequestOptions
  ): Promise<
    | ChatCompletion
    | MockStream
    | Stream<ChatCompletionChunk>
    | MockChatCompletion
    | AsyncIterableIterator<ChatCompletionChunkStreamClass>
    | undefined
    | Error
  > {
    const isOpenAIModel = await this.isModelFromOpenAI(body.model);
    const [newKwargs, settings] = await this.formatParams(body, isOpenAIModel);
    newKwargs.messages = this.formatMessages(
      newKwargs.messages as Array<ChatCompletionMessageParam>
    );

    let modelNameForLogs = newKwargs.model;
    let { tags, saveData, useFallback, fallbackModel } = settings;

    try {
      if (isOpenAIModel) {
        return await this.handleOpenAIModel({
          body: newKwargs as ChatCompletionCreateParamsBase,
          options,
          tags,
          saveData,
          modelNameForLogs,
        });
      } else if (!isOpenAIModel && this.tromeroClient) {
        return await this.handleTromeroModel({
          body: newKwargs as TromeroCompletionParams,
          tags,
          saveData,
          modelNameForLogs,
        });
      } else {
        return Promise.reject(
          'Error: Tromero client not set. Please set the client before calling create.'
        );
      }
    } catch (error) {
      if (useFallback && fallbackModel) {
        console.warn('Error with main model, using fallback model:', error);
        modelNameForLogs = fallbackModel;
        return await this.handleChatCompletion(
          {
            ...body,
            model: fallbackModel,
            useFallback: false,
          },
          options
        );
      } else {
        console.warn('Error creating completion:', error);
        return Promise.reject(error);
      }
    }
  }

  private async handleOpenAIModel({
    body,
    options,
    tags,
    saveData,
    modelNameForLogs,
  }: {
    body: ChatCompletionCreateParams & ChatCompletionCreateParamsBase;
    options?: Core.RequestOptions;
    tags?: string | string[] | number[] | undefined;
    saveData?: boolean | undefined;
    modelNameForLogs: string;
  }): Promise<
    ChatCompletion | MockStream | Stream<ChatCompletionChunk> | undefined
  > {
    let res: ChatCompletion | Stream<ChatCompletionChunk> | undefined;

    const { messages, model, stream, ...openAiParams } = body;

    if (stream) {
      try {
        res = await this._create(body, options);
      } catch (error) {
        console.warn('Error creating openAI stream', error);
        return Promise.reject(error);
      }
      return new MockStream(res, async (response) => {
        if (!saveData) return '';
        const dataToSend = {
          messages: [...messages, response?.choices[0].message],
          model: modelNameForLogs,
          kwargs: openAiParams,
          creation_time: new Date().toISOString(),
          tags: Array.isArray(tags)
            ? tags.join(', ')
            : typeof tags === 'string'
            ? tags
            : '',
        };
        return await this.saveDataOnServer(saveData, dataToSend);
      });
    } else {
      try {
        res = await this._create(body, options);
      } catch (error) {
        console.warn('Error creating openAI completion', error);
        return Promise.reject(error);
      }
      if (res.choices) {
        for (const choice of res.choices) {
          if (saveData) {
            await this.saveDataOnServer(saveData, {
              messages: messages.concat([choice.message]),
              model: modelNameForLogs,
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
  }

  private async handleTromeroModel({
    body,
    tags,
    saveData,
    modelNameForLogs,
  }: {
    body: TromeroCompletionParams;
    tags?: string | string[] | number[] | undefined;
    saveData?: boolean | undefined;
    modelNameForLogs: string;
  }): Promise<
    | MockChatCompletion
    | AsyncIterableIterator<ChatCompletionChunkStreamClass>
    | undefined
    | Error
  > {
    let res:
      | MockChatCompletion
      | AsyncIterableIterator<ChatCompletionChunkStreamClass>
      | undefined
      | Error;

    const { messages, model, stream, ...tromeroParams } = body;

    try {
      let modelData: ModelDataDetails | undefined =
        this.tromeroClient!.modelData[model];

      if (!modelData) {
        const { url, baseModel, error } = await this.tromeroClient!.getModelUrl(
          model
        );
        if (error) {
          throw new Error(error);
        }
        modelData = {
          url,
          adapter_name: baseModel ? 'NO_ADAPTER' : model,
        };
        this.tromeroClient!.modelData[model] = modelData;
      }

      if (stream && modelData) {
        try {
          res = this.tromeroClient!.createStream(
            modelData!.adapter_name,
            modelData!.url,
            messages,
            saveData
              ? {
                  saveData,
                  model: modelNameForLogs,
                  kwargs: tromeroParams,
                  tags: Array.isArray(tags)
                    ? tags.join(', ')
                    : typeof tags === 'string'
                    ? tags
                    : '',
                }
              : tromeroParams
          );

          if (!res || !res[Symbol.asyncIterator]) {
            throw new Error('Stream not created');
          }

          try {
            await res.next();
          } catch (error) {
            throw error;
          }
        } catch (error) {
          throw error;
        }
      } else if (modelData) {
        try {
          const response = await this.tromeroClient!.create(
            modelData!.adapter_name,
            modelData!.url,
            messages,
            tromeroParams
          );
          if (response.generated_text && response.usage) {
            res = mockOpenAIFormat(
              response.generated_text,
              model,
              response.usage
            ) as MockChatCompletion;
            if (saveData) {
              for (const choice of res.choices) {
                await this.saveDataOnServer(saveData, {
                  messages: messages.concat([choice.message]),
                  model: modelNameForLogs,
                  kwargs: tromeroParams,
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
        } catch (error) {
          throw error;
        }
        return res;
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
