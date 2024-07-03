export interface Message {
  role: string;
  content: string;
}

export interface Choice {
  message: Message;
}

export interface CompletionResponse {
  choices: Choice[];
  usage?: any;
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
  content: string;
  role: string;

  constructor(content: string, role: string = 'assistant') {
    this.content = content;
    this.role = role;
  }
}

export class Choice {
  message: Message;

  constructor(message: string) {
    this.message = new Message(message);
  }
}

class Response {
  choices: Choice[];

  constructor(choices: Choice[]) {
    this.choices = choices;
  }
}

export function mockOpenAIFormat(messages: string): Response {
  const choice = new Choice(messages);
  return new Response([choice]);
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
