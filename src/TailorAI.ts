import * as openai from 'openai';
import * as Core from 'openai/core';
import { readEnv } from 'openai/core';
import type { Stream } from 'openai/streaming';
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParams,
  ChatCompletionCreateParamsBase,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
} from 'openai/resources/chat/completions';
import OpenAI, { ClientOptions } from 'openai';
import { Chat, Completions } from 'openai/resources/chat';
import { RequestOptions, APIPromise } from 'openai/core';
import TromeroClient from './Tromero';
import { getModelUrl } from './tromeroRequests';
import { Choice, Message, mockOpenAIFormat } from './tromeroUtils';
import { TromeroCompletionArgs, TromeroCompletionMeta } from './shared';
import { MockStream } from './openai/streaming';

interface TailorAIOptions extends ClientOptions {
  apiKey: string;
  tromeroKey: string;
  saveData?: boolean;
}

export default class Tromero extends openai.OpenAI {
  public tromeroClient?: TromeroClient;
  public modelUrls: { [key: string]: string };
  public baseModel: { [key: string]: string };

  constructor({ tromeroKey, ...opts }: TailorAIOptions) {
    super({ ...opts });

    if (tromeroKey) {
      const tromeroClient = new TromeroClient({ apiKey: tromeroKey });
      this.chat.setClient(tromeroClient);
    } else {
      console.warn(
        "You're using the Tromero client without an API key. While OpenAI requests will still go through, Tromero requests will fail."
      );
    }
    this.modelUrls = {}
    this.baseModel = {}
  }

  chat: MockChat = new MockChat(this);
}

class MockChat extends openai.OpenAI.Chat {
  setClient(client: TromeroClient) {
    this.completions.tromeroClient = client;
  }

  completions: MockCompletions = new MockCompletions(this._client);
}

class MockCompletions extends openai.OpenAI.Chat.Completions {
  openaiClient: openai.OpenAI;
  tromeroClient?: TromeroClient;

  constructor(client: openai.OpenAI, tromeroClient?: TromeroClient) {
    super(client);
    this.openaiClient = client;
    this.tromeroClient = tromeroClient;
  }

  private choiceToDict(choice: Choice): Choice {
    return {
      message: {
        content: choice.message.content,
        role: choice.message.role,
      },
    };
  }

  async private saveDataOnServer (saveData: boolean, data: any): Promise<string> {
    try {
      if (saveData) {
        setTimeout(() => this.tromeroClient?.postData(data), 0);
      }
    } catch (error) {
    }
    return '';
  }

  private async formatKwargs (kwargs: {
    [key: string]: any;
  }): Promise<{formattedKwargs: { [key: string]: any }, openAiKwargs: { [key: string]: any }}>
    {
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
    const openAiKwargs: { [key: string]: any } = {};

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

      if (keysToKeep.includes(key)) {
        openAiKwargs[key] = kwargs[key];
      }
    }

    if (invalidKeyFound) {
      console.log(
        'The following parameters are valid for the model: ',
        keysToKeep.join(', ')
      );
    }
    return {formattedKwargs, openAiKwargs }
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
      console.warn("Error in retrieving OpenAi's model list");
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

  // @ts-expect-error Type mismatch because a `Promise<>` is being used.
  // wrapper but I actually think the types are correct here.
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
    { saveData, tags, ...body }: ChatCompletionCreateParams & TromeroCompletionArgs,
    options?: Core.RequestOptions
  ): Promise<Core.APIPromise<ChatCompletion | MockStream>> {


     const {
       model,
       use_fallback = true,
       fallback_model = '',
       ...kwargs,
     } = body as any;
     const messages = this.formatMessages(kwargs.messages);
    const { formattedKwargs, openAiKwargs } = await this.formatKwargs(kwargs);

    let isOpenAiModel = await this.isModelFromOpenAi(model);

    if (isOpenAiModel) {
      if (body.stream) {
        const stream = await this._create(body, options);
        try {
          return new MockStream(stream, (response): Promise<string> => {
            if (!saveData) return Promise.resolve('');
            return this.saveDataOnServer(saveData, { messages, model, ...formattedKwargs, creation_time: new Date().toISOString(), tags });
          });
        } catch (e) {
          console.error('Tromero: error creating Mock stream');
          console.error(e);
          throw e;
        }
      } else {
        const response = await this._create(body, options);

        /*  the python version of this code is:

        if hasattr(res, 'choices'):
            for choice in res.choices:
                formatted_choice = self._choice_to_dict(choice)
                save_data = {"messages": formatted_messages + [formatted_choice['message']],
                                "model": model,
                                "kwargs": send_kwargs,
                                "creation_time": str(datetime.datetime.now().isoformat()),
                                "tags": self._tags_to_string(tags)
                                }
                # if hasattr(res, 'usage'):
                #     save_data['usage'] = res.usage.model_dump()
                self._save_data(save_data)

        */

        if (response.choices) {
          for (const choice of response.choices) {
            const formattedChoice = this.choiceToDict(choice);
            if
            this.saveDataOnServer(saveData, { messages, model, ...formattedKwargs, creation_time: new Date().toISOString(), tags });
          }
        }

        if (saveData) {
          this.saveDataOnServer(saveData, { messages, model, ...formattedKwargs, creation_time: new Date().toISOString(), tags });
        }



    const finetunedb = {
      logRequest: true,
      ...rawFinetunedb,
    };
    const startTime = Date.now();
    let logId: FinetuneDbCompletionMeta['logId'] = '';

    try {
      if (body.stream) {
        const stream = await this._create(body, options);
        try {
          return new MockStream(stream, (response) => {
            if (!finetunedb.logRequest) return '';
            return this._report({
              projectId: finetunedb.projectId
                ? finetunedb.projectId
                : this.finetuneDbClient?.projectId ?? '',
              parentId: finetunedb.parentId,
              body: body,
              response: response,
              latency: Date.now() - startTime,
              inputTokenCount: response?.usage?.prompt_tokens ?? 0,
              outputTokenCount: response?.usage?.completion_tokens ?? 0,
              tags: finetunedb.tags,
              metadata: finetunedb.metadata,
            });
          });
        } catch (e) {
          console.error('FinetuneDB: error creating wrapped stream');
          console.error(e);
          throw e;
        }
      } else {
        const response = await this._create(body, options);

        if (
          !finetunedb.projectId &&
          !(this.finetuneDbClient && this.finetuneDbClient.projectId)
        ) {
          console.warn(
            "You're using the FinetuneDB client without a project ID. No completion requests will be logged."
          );
        }

        logId =
          finetunedb.logRequest &&
          (finetunedb.projectId || this.finetuneDbClient?.projectId)
            ? this._report({
                projectId: finetunedb.projectId
                  ? finetunedb.projectId
                  : this.finetuneDbClient?.projectId ?? '',
                parentId: finetunedb.parentId,
                body: body,
                response: response,
                latency: Date.now() - startTime,
                inputTokenCount: response?.usage?.prompt_tokens ?? 0,
                outputTokenCount: response?.usage?.completion_tokens ?? 0,
                tags: finetunedb.tags,
                metadata: finetunedb.metadata,
              })
            : '';

        return {
          ...response,
          finetunedb: {
            logId,
            getLastLogId: () => {
              return logId;
            },
            updateLastLog: async (update) => {
              if (logId) {
                return await this.finetuneDbClient?.updateLog(logId, {
                  ...update,
                  projectId: finetunedb.projectId
                    ? finetunedb.projectId
                    : this.finetuneDbClient?.projectId ?? '',
                });
              }
              return undefined;
            },
          },
        };
      }
    } catch (error: unknown) {
      if (error instanceof openai.APIError) {
        const rawMessage = error.message as string | string[];
        const message = Array.isArray(rawMessage)
          ? rawMessage.join(', ')
          : rawMessage;
        if (
          !finetunedb.projectId &&
          !(this.finetuneDbClient && this.finetuneDbClient.projectId)
        ) {
          console.warn(
            "You're using the FinetuneDB client without a project ID. No completion requests will be logged."
          );
        } else {
          logId = this._report({
            projectId: finetunedb.projectId
              ? finetunedb.projectId
              : this.finetuneDbClient?.projectId ?? '',
            parentId: finetunedb.parentId,
            body: body,
            response: null,
            latency: Date.now() - startTime,
            inputTokenCount: 0,
            outputTokenCount: 0,
            tags: finetunedb.tags,
            error: message,
            metadata: finetunedb.metadata,
          });
        }
      }

      // make sure error is an object we can add properties to
      if (typeof error === 'object' && error !== null) {
        error = {
          ...error,
          finetunedb: {
            logId,
          },
        };
      }

      throw error;
    }
  }

  creates(
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
