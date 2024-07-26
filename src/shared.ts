import * as Core from 'openai/core';
import { readEnv } from 'openai/core';
import type { Stream } from 'openai/streaming';
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParams,
  ChatCompletionCreateParamsBase,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
} from 'openai/resources/chat/completions';

export type TromeroCompletionArgs = {
  saveData?: boolean;
  tags?: string[];
  fallbackModel?: string;
};

export type TromeroCompletionMeta = {
  logId: string;
  getLastLogId: () => string;
  updateLastLog: (update: TromeroPutLogRequest) => Promise<string | undefined>;
};
