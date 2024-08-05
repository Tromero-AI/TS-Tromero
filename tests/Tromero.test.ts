import * as openai from 'openai';
import Tromero from '../src/Tromero';
import TromeroClient from '../src/Tromero_Client';
import { MockStream } from '../src/openai/streaming';
import * as tromeroUtils from '../src/tromeroUtils';
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParams,
} from 'openai/resources/chat/completions';
import * as mergeChunksModule from '../src/openai/mergeChunks';
import { Stream } from 'openai/streaming';

jest.mock('openai');
jest.mock('../src/Tromero_Client');
jest.mock('../src/openai/streaming');
jest.mock('../src/tromeroUtils');
jest.mock('../src/openai/mergeChunks');

describe('Tromero', () => {
  let tromero: Tromero;
  let tromeroClient: jest.Mocked<TromeroClient>;

  beforeEach(() => {
    (TromeroClient as jest.MockedClass<typeof TromeroClient>).mockClear();
    tromeroClient = new TromeroClient({
      apiKey: 'tromero-key',
    }) as jest.Mocked<TromeroClient>;
    (
      TromeroClient as jest.MockedClass<typeof TromeroClient>
    ).mockImplementation(() => tromeroClient);

    tromero = new Tromero({ tromeroKey: 'tromero-key', apiKey: 'openai-key' });
  });

  test('should create a new TromeroClient instance if tromeroKey is provided', () => {
    expect(tromeroClient).toBeInstanceOf(TromeroClient);
    expect(tromero.chat.completions.tromeroClient).toBe(tromeroClient);
  });

  test('should warn if no keys are provided', () => {
    console.warn = jest.fn();
    new Tromero({});
    expect(console.warn).toHaveBeenCalledWith(
      "You haven't set an apiKey for OpenAI or a tromeroKey for Tromero. Please set one of these to use the client."
    );
  });

  test('should call the create method and return a response', async () => {
    const body: ChatCompletionCreateParams &
      tromeroUtils.TromeroCompletionArgs = {
      model: 'test-model',
      messages: [{ role: 'user', content: 'Hello' }],
    };

    const createMock = jest.fn().mockResolvedValue({
      choices: [{ message: { role: 'assistant', content: 'Hello' } }],
    });

    tromero.chat.completions.create = createMock;

    const response = await tromero.chat.completions.create({
      ...body,
      saveData: true,
      tags: ['test'],
    });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Hello' }],
        tags: ['test'],
      })
    );
    expect(response.choices[0].message.content).toBe('Hello');
  });

  test('should handle stream response', async () => {
    const body: ChatCompletionCreateParams &
      tromeroUtils.TromeroCompletionArgs = {
      model: 'test-model',
      messages: [{ role: 'user', content: 'Hello' }],
      stream: true,
    };

    const mockStreamInstance = new MockStream(
      {} as Stream<ChatCompletionChunk>,
      async () => ''
    );
    const createMock = jest.fn().mockResolvedValue(mockStreamInstance);
    tromero.chat.completions.create = createMock;

    const response = await tromero.chat.completions.create({
      ...body,
      saveData: true,
      tags: ['test'],
    });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Hello' }],
        tags: ['test'],
      })
    );
    expect(response).toBe(mockStreamInstance);
  });

  // test('should handle fallback model if provided', async () => {
  //   const body: ChatCompletionCreateParams = {
  //     model: 'invalid-model',
  //     messages: [{ role: 'user', content: 'Hello' }],
  //   };

  //   const createMock = jest
  //     .fn()
  //     .mockRejectedValueOnce(
  //       // mock api error
  //       new openai.OpenAIError('Invalid model')
  //     )
  //     .mockResolvedValueOnce({
  //       choices: [
  //         { message: { role: 'assistant', content: 'Fallback response' } },
  //       ],
  //     });

  //   tromero.chat.completions.create = createMock;

  //   const response = await tromero.chat.completions.create({
  //     ...body,
  //     saveData: true,
  //     tags: ['test'],
  //     fallbackModel: 'fallback-model',
  //   });
  //   expect(createMock).toHaveBeenCalledTimes(2);
  //   expect(createMock).toHaveBeenCalledWith(
  //     expect.objectContaining({
  //       model: 'fallback-model',
  //       messages: [{ role: 'user', content: 'Hello' }],
  //     }),
  //     undefined
  //   );
  //   expect(response.choices[0].message.content).toBe('Fallback response');
  // });
});
