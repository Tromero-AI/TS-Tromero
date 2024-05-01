// Define the Message class
class Message {
  content: string;
  role: string;

  constructor(content: string, role: string = 'assistant') {
    this.content = content;
    this.role = role;
  }
}

// Define the Choice class
class Choice {
  message: Message;

  constructor(message: string) {
    this.message = new Message(message);
  }
}

// Define the Response class
class Response {
  choices: Choice[];

  constructor(choices: Choice[]) {
    this.choices = choices;
  }
}

// Define the mock_openai_format function
export function mockOpenaiFormat(messages: string): Response {
  const choices = [new Choice(messages)]; // Create a list of Choice objects
  const response = new Response(choices);
  return response;
}
