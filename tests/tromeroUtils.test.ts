import {
  MockMessage,
  Choice,
  MockChatCompletion,
  mockOpenAIFormat,
  ChatCompletionChunkStreamClass,
} from '../src/tromeroUtils';

describe('Tromero Utils', () => {
  describe('MockMessage class', () => {
    test('should create a MockMessage instance with default role', () => {
      const message = new MockMessage('Hello, World!');
      expect(message.content).toBe('Hello, World!');
      expect(message.role).toBe('assistant');
    });
  });

  describe('Choice class', () => {
    test('should create a Choice instance', () => {
      const choice = new Choice('Choice message', 1);
      expect(choice.message.content).toBe('Choice message');
      expect(choice.finish_reason).toBe('stop');
      expect(choice.index).toBe(1);
      expect(choice.logprobs).toBeNull();
    });
  });

  describe('MockChatCompletion class', () => {
    test('should create a MockChatCompletion instance', () => {
      const choice = new Choice('Response message');
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
    test('should return a formatted MockChatCompletion', () => {
      const message = 'Mock message';
      const model = 'mock-model';
      const usage = { key: 'value' };
      const response = mockOpenAIFormat(message, model, usage);
      expect(response.choices[0]?.message.content).toBe('Mock message');
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
      expect(chunkStream.choices[0]?.delta.content).toBe('Stream response');
    });

    test('should return choices', () => {
      const params = {
        model: 'test-model',
        streamResponse: 'Stream response',
      };
      const chunkStream = new ChatCompletionChunkStreamClass(params);
      const choices = chunkStream.getChoices();
      expect(choices).toHaveLength(1);
      expect(choices[0]?.delta.content).toBe('Stream response');
    });
  });
});
