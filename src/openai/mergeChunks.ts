import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionMessage,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat';

const omit = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> => {
  const ret = { ...obj };
  for (const key of keys) {
    delete ret[key];
  }
  return ret;
};

export default function mergeChunks(
  base: ChatCompletion | null,
  chunk: ChatCompletionChunk
): ChatCompletion {
  if (base === null) {
    return mergeChunks(
      { ...chunk, object: 'chat.completion', choices: [] },
      chunk
    );
  }

  const choices = [...base.choices];
  for (const choice of chunk.choices) {
    const baseChoice = choices.find((c) => c.index === choice.index);
    if (baseChoice) {
      baseChoice.finish_reason =
        choice.finish_reason ?? baseChoice.finish_reason;
      baseChoice.message = baseChoice.message ?? { role: 'assistant' };

      if (choice.delta?.content) {
        baseChoice.message.content =
          (baseChoice.message.content ?? '') + (choice.delta.content ?? '');
      }

      if (choice.delta?.tool_calls) {
        baseChoice.message.tool_calls = baseChoice.message.tool_calls ?? [];
        baseChoice.message.tool_calls.push(
          ...choice.delta.tool_calls.map(
            (tc) =>
              ({
                ...tc,
                id: tc.id ?? '',
              } as ChatCompletionMessageToolCall)
          )
        );
      }
    } else {
      choices.push({
        index: choice.index,
        finish_reason: choice.finish_reason ?? 'stop',
        logprobs: choice.logprobs ?? null,
        message: {
          role: 'assistant',
          ...choice.delta,
          tool_calls: choice.delta?.tool_calls?.map(
            (tc) =>
              ({
                ...tc,
                id: tc.id ?? '',
              } as ChatCompletionMessageToolCall)
          ),
        } as ChatCompletionMessage,
      });
    }
  }

  const merged: ChatCompletion = {
    ...base,
    choices,
  };

  return merged;
}
