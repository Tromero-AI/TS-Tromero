import type {
  ChatCompletion,
  ChatCompletionChunk,
} from 'openai/resources/chat';
import { Stream } from 'openai/streaming';
import mergeChunks from './mergeChunks';

/**
 * A mock stream that saves the final completion to a file.
 * @param stream - The stream to mock.
 * @param saveData - The function to save the completion data.
 * @returns The mock stream.
 */
export class MockStream extends Stream<ChatCompletionChunk> {
  private saveData: (response: ChatCompletion | null) => Promise<string>;

  constructor(
    stream: Stream<ChatCompletionChunk>,
    saveData: (response: ChatCompletion | null) => Promise<string>
  ) {
    // @ts-expect-error - This is a private property but we need to access it
    super(stream.iterator, stream.controller);
    this.saveData = saveData;
  }

  async *[Symbol.asyncIterator](): AsyncIterator<
    ChatCompletionChunk,
    any,
    undefined
  > {
    const iterator = super[Symbol.asyncIterator]();

    let combinedResponse: ChatCompletion | null = null;
    while (true) {
      const result = await iterator.next();
      if (result.done) break;
      combinedResponse = mergeChunks(combinedResponse, result.value);

      yield result.value;
    }

    await this.saveData(combinedResponse);
  }
}
