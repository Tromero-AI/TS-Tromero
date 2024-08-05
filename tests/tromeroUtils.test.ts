import {
  TromeroAIOptions,
  ApiResponse,
  Message,
  Choice,
  MockChatCompletion,
  mockOpenAIFormat,
  TromeroCompletionArgs,
  TromeroCompletionResponse,
  ChatCompletionChunkStreamClass,
} from '../src/tromeroUtils';

describe('Tromero Utils', () => {
  describe('Message class', () => {
    test('should create a Message instance with default role', () => {
      const message = new Message('Hello, World!');
      expect(message.content).toBe('Hello, World!');
      expect(message.role).toBe('assistant');
    });

    test('should create a Message instance with specified role', () => {
      const message = new Message('Hello, User!', 'user');
      expect(message.content).toBe('Hello, User!');
      expect(message.role).toBe('user');
    });
  });

  describe('Choice class', () => {
    test('should create a Choice instance', () => {
      const choice = new Choice(new Message('Choice message'), 1);
      expect(choice.message.content).toBe('Choice message');
      expect(choice.finish_reason).toBe('stop');
      expect(choice.index).toBe(1);
      expect(choice.logprobs).toBeNull();
    });
  });

  describe('Response class', () => {
    test('should create a Response instance', () => {
      const choice = new Choice(new Message('Response message'));
      const response = new MockChatCompletion([choice], 'test-model', {
        usage: 'test',
      });
      expect(response.choices).toHaveLength(1);
      expect(response.model).toBe('test-model');
      expect(response.object).toBe('chat.completion');
      expect(response.usage).toEqual({ usage: 'test' });
    });
  });

  describe('mockOpenAIFormat function', () => {
    test('should return a formatted Response', () => {
      const messages = [new Message('Mock message')];
      const model = 'mock-model';
      const usage = { key: 'value' };
      const response = mockOpenAIFormat(messages, model, usage);
      expect(response.choices[0].message.content).toBe('Mock message');
      expect(response.model).toBe('mock-model');
      expect(response.usage).toEqual(usage);
    });
  });

  describe('ChatCompletionChunkStreamClass', () => {
    test('should create a ChatCompletionChunkStreamClass instance', () => {
      const params = {
        model: 'test-model',
        streamResponse: 'Stream response',
      };
      const chunkStream = new ChatCompletionChunkStreamClass(params);
      expect(chunkStream.model).toBe('test-model');
      expect(chunkStream.streamResponse).toBe('Stream response');
      expect(chunkStream.choices[0].delta.content).toBe('Stream response');
    });

    test('should return choices', () => {
      const params = {
        model: 'test-model',
        streamResponse: 'Stream response',
      };
      const chunkStream = new ChatCompletionChunkStreamClass(params);
      const choices = chunkStream.getChoices();
      expect(choices).toHaveLength(1);
      expect(choices[0].delta.content).toBe('Stream response');
    });
  });
});
