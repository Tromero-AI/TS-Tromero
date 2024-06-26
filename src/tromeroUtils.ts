class Message {
  content: string;
  role: string;

  constructor(content: string, role: string = 'assistant') {
    this.content = content;
    this.role = role;
  }
}

class Choice {
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
