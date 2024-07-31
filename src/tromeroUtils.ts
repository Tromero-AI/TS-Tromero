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
  role: string;
  content: string | null;
}

export interface Choice {
  message: Message;
}

export interface CompletionResponse {
  choices: Choice[];
  usage?: any;
  [key: string]: any;
}

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
  role: string;

  constructor(content: string, role: string = 'assistant') {
    this.content = content;
    this.role = role;
  }
}

export class Choice {
  message: Message;
  finish_reason: string | null;
  index: number;
  logprobs: any;

  constructor(message: string) {
    this.message = new Message(message);
    this.finish_reason = 'stop';
    this.index = 0;
    this.logprobs = null;
  }
}

export class Response {
  choices: Choice[];
  id: string;
  model: string;
  created: string;
  usage: any;

  constructor(choices: Choice[], model: string = '') {
    this.choices = choices;
    this.id = '';
    this.model = model;
    this.created = '';
    this.usage = {};
  }
}

export function mockOpenAIFormat(messages: string, model: string): Response {
  const choice = new Choice(messages);
  const response = new Response([choice], model);
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
