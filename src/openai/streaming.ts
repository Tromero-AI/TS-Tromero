import type {
  ChatCompletion,
  ChatCompletionChunk,
} from 'openai/resources/chat';
import { Stream } from 'openai/streaming';
import { TromeroCompletionMeta } from '../shared';
import mergeChunks from './mergeChunks';

export class MockStream extends Stream<ChatCompletionChunk> {
  tromero: TromeroCompletionMeta;

  private report: (response: ChatCompletion | null) => Promise<string>;

  constructor(
    stream: Stream<ChatCompletionChunk>,
    report: (response: ChatCompletion | null) => Promise<string>
  ) {
    // @ts-expect-error - This is a private property but we need to access it
    super(stream.iterator, stream.controller);
    this.report = report;

    const logId = '';

    this.tromero = {
      logId,
      getLastLogId: () => {
        return '';
      },
      updateLastLog: async () => {
        return undefined;
      },
    };
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

    await this.report(combinedResponse);
  }
}
