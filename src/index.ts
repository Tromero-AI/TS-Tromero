import { Completions, Chat } from 'openai/resources';
import OpenAI from 'openai';
import { mockOpenaiFormat } from './tromeroUtils';
import { tromeroModelCreate, postData } from './tromeroRequests';

const openai = new OpenAI();

interface Choice {
  finish_reason: string;
  index: number;
  logprobs: any; // Define the proper structure for logprobs
  message: {
    content: string;
    role: string;
  };
}

interface CompletionResponse {
  choices: Choice[];
  usage: any; // Define the proper structure for usage
}

class MockCompletions extends Completions {
  client: any; // Define the correct type

  constructor(client: any) {
    super(client);
    this.client = client;
  }

  private choiceToDict(choice: Choice): any {
    return {
      finish_reason: choice.finish_reason,
      index: choice.index,
      logprobs: choice.logprobs,
      message: choice.message,
    };
  }

  private async saveData(data: any) {
    await postData(data, this.client.tromero_key);
  }

  private async checkModel(model: string): Promise<boolean> {
    try {
      const models = await this.client.models.list();
      const modelNames = models.map((m: any) => m.id);
      return modelNames.includes(model);
    } catch (error) {
      return false;
    }
  }

  async create(args: any, kwargs: any): Promise<CompletionResponse> {
    const input = { model: kwargs.model, messages: kwargs.messages };
    const formattedKwargs = { ...kwargs };
    delete formattedKwargs.model;
    delete formattedKwargs.messages;

    if (await this.checkModel(kwargs.model)) {
      const res = await super.create(args, kwargs);

      if (res && res.choices) {
        const usage = res.usage;
        for (const choice of res.choices) {
          const formattedChoice = this.choiceToDict(choice);
          await this.saveData({
            messages: [...input.messages, formattedChoice.message],
            model: input.model,
            kwargs: formattedKwargs,
            creation_time: new Date().toISOString(),
            usage: usage,
          });
        }
      }
      return res;
    } else {
      const messages = kwargs.messages;
      const res = await tromeroModelCreate(
        kwargs.model,
        messages,
        this.client.tromero_key
      );
      if (res.generated_text) {
        return mockOpenaiFormat(res.generated_text);
      }
    }
  }
}

class MockChat extends Chat {
  client: any; // Define the correct type

  constructor(client: any) {
    super(client);
    this.client = client;
  }

  get completions(): MockCompletions {
    return new MockCompletions(this.client);
  }
}

export class TailorAI extends OpenAI {
  chat: MockChat;
  tromero_key: string;
  current_prompt: string[];

  constructor(api_key: string, tromero_key: string) {
    super(api_key);
    this.tromero_key = tromero_key;
    this.current_prompt = [];
    this.chat = new MockChat(this);
  }
}
