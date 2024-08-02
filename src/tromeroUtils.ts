import * as Core from 'openai/core';
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParams,
  ChatCompletionCreateParamsBase,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
} from 'openai/resources/chat/completions';

export interface Message {
  role: 'assistant' | 'user' | 'system' | 'tool' | undefined;
  content: string | null;
}

export interface Choice {
  message: Message;
}

// export interface CompletionResponse {
//   choices: Choice[];
//   usage?: any;
//   [key: string]: any;
// }

export interface Model {
  id: string;
}

export interface SaveData {
  messages: Message[];
  model: string;
  kwargs: any;
  creation_time: string;
  tags: string;
  usage?: any;
}

export interface Client {
  modelUrls: { [key: string]: string };
  isBaseModel: { [key: string]: boolean };
  tromero_key: string;
  saveData: boolean;
}

export type StreamResponse = AsyncIterable<{
  choices: { delta: { content: string } }[];
}>;

export interface TromeroCreateResponse {
  generated_text?: string;
}

export class Message {
  content: string | null;
  role: 'assistant' | 'user' | 'system' | 'tool' | undefined;

  constructor(
    content: string,
    role: 'assistant' | 'user' | 'system' | 'tool' | undefined = 'assistant'
  ) {
    this.content = content;
    this.role = role;
  }
}

export class Choice {
  message: Message;
  finish_reason: string | null;
  index: number;
  logprobs: any;

  constructor(message: string, index: number = 0) {
    this.message = new Message(message);
    this.finish_reason = 'stop';
    this.index = index;
    this.logprobs = null;
  }
}

export class Response {
  choices: Choice[];
  id: string;
  model: string;
  created: number;
  usage: any;
  object: string;

  constructor(choices: Choice[], model: string = '', usage = {}) {
    this.choices = choices;
    this.id = '';
    this.object = 'chat.completion';
    this.model = model;
    this.created = Math.floor(Date.now() / 1000);
    this.usage = usage;
  }
}

export function mockOpenAIFormat(
  messages: string,
  model: string,
  usage: { [key: string]: string }
): Response {
  const choice = new Choice(messages);
  const response = new Response([choice], model, usage);
  return response;
}

class StreamChoice {
  delta: Message;

  constructor(message: string) {
    this.delta = new Message(message);
  }
}

export class StreamResponseObject {
  choices: StreamChoice[];

  constructor(choices: StreamChoice[]) {
    this.choices = choices;
  }
}

export function mockOpenAIFormatStream(messages: string): StreamResponseObject {
  const choice = new StreamChoice(messages);
  return new StreamResponseObject([choice]);
}

export type TromeroCompletionArgs = {
  saveData?: boolean;
  tags?: string[];
  fallbackModel?: string;
};

export type TromeroCompletionResponse = {
  generated_text: string;
  model: string;
  creation_time: string;
  tags: string;
};

interface ChatCompletionChunkStreamParams {
  id?: string;
  object?: string;
  created?: number;
  model: string;
  system_fingerprint?: string;
  choices?: ChoiceStream[];
  streamResponse: string;
  finishReason?: any;
}

interface ChoiceStream {
  index: number;
  delta: Message;
  logprobs: any;
  finish_reason: any;
}

export class ChatCompletionChunkStreamClass {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  system_fingerprint?: string;
  choices: ChoiceStream[];
  streamResponse: string;
  finishReason: any;

  constructor({
    id = '',
    created = Math.floor(Date.now() / 1000),
    model,
    system_fingerprint,
    streamResponse,
    finishReason = null,
  }: ChatCompletionChunkStreamParams) {
    this.id = id;
    this.object = 'chat.completion.chunk' as const;
    this.created = created;
    this.model = model;
    this.system_fingerprint = system_fingerprint;
    this.streamResponse = streamResponse;
    this.finishReason = finishReason;
    this.choices = [
      {
        index: 0,
        delta: new Message(streamResponse),
        logprobs: null,
        finish_reason: finishReason,
      },
    ];
  }

  getChoices(): ChoiceStream[] {
    return this.choices;
  }
}
