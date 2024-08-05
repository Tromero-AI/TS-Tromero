export interface TromeroOptions {
  tromeroKey: string;
  baseURL?: string;
  dataURL?: string;
}

export interface ApiResponse {
  error?: string;
  status_code: string | number;
  [key: string]: any;
}

export class Message {
  content: string | null;
  role?: 'assistant' | 'user' | 'system' | 'tool' | undefined;
  tool_call_id?: string;

  constructor(
    content: string | null,
    role:
      | 'assistant'
      | 'user'
      | 'system'
      | 'tool'
      | undefined = 'assistant' as const
  ) {
    this.content = content;
    this.role = role;
  }
}

export class Choice {
  message: Message;
  finish_reason:
    | 'stop'
    | 'length'
    | 'tool_calls'
    | 'content_filter'
    | 'function_call';
  index: number;
  logprobs: any;

  constructor(message: string | Message, index: number = 0) {
    if (typeof message === 'string') {
      this.message = new Message(message);
    } else {
      this.message = new Message(message.content, message.role);
    }
    this.finish_reason = 'stop' as const;
    this.index = index;
    this.logprobs = null;
  }
}

export class MockChatCompletion {
  choices: Choice[];
  id: string;
  model: string;
  created: number;
  usage: any;
  object: string;

  constructor(choices: Choice[], model: string = '', usage = {}) {
    this.choices = choices;
    this.id = '';
    this.object = 'chat.completion';
    this.model = model;
    this.created = Math.floor(Date.now() / 1000);
    this.usage = usage;
  }
}

export function mockOpenAIFormat(
  messages: Message[],
  model: string,
  usage: { [key: string]: string }
): MockChatCompletion {
  const choices = Array.from(
    { length: messages.length },
    (_, i) => new Choice(messages[i], i)
  );
  const response = new MockChatCompletion(choices, model, usage);
  return response;
}

export type TromeroArgs = {
  tags?: string[] | number[] | string;
  useFallback?: boolean;
  fallbackModel?: string;
  saveData?: boolean;
};

export interface TromeroCompletionParams {
  /**
   * Name of the model to use.
   */
  model: string;

  /**
   * A list of messages comprising the conversation so far.
   */
  messages: Message[];

  /**
   * If set, partial message deltas will be sent as they become available.
   */
  stream?: boolean;

  /**
   * Number of output sequences to return for the given prompt.
   */
  n?: number;

  /**
   * Number of output sequences that are generated from the prompt.
   * From these `best_of` sequences, the top `n` sequences are returned.
   * `best_of` must be greater than or equal to `n`. This is treated as
   * the beam width when `use_beam_search` is True. By default, `best_of`
   * is set to `n`.
   */
  best_of?: number;

  /**
   * Float that penalizes new tokens based on whether they
   * appear in the generated text so far. Values > 0 encourage the model
   * to use new tokens, while values < 0 encourage the model to repeat
   * tokens.
   */
  presence_penalty?: number;

  /**
   * Float that penalizes new tokens based on their frequency
   * in the generated text so far. Values > 0 encourage the model
   * to use new tokens, while values < 0 encourage the model to repeat
   * tokens.
   */
  frequency_penalty?: number;

  /**
   * Float that penalizes new tokens based on whether
   * they appear in the prompt and the generated text so far. Values > 1
   * encourage the model to use new tokens, while values < 1 encourage
   * the model to repeat tokens.
   */
  repetition_penalty?: number;

  /**
   * Float that controls the randomness of the sampling. Lower
   * values make the model more deterministic, while higher values make
   * the model more random. Zero means greedy sampling.
   */
  temperature?: number;

  /**
   * Float that controls the cumulative probability of the top tokens
   * to consider. Must be in (0, 1]. Set to 1 to consider all tokens.
   */
  top_p?: number;

  /**
   * Integer that controls the number of top tokens to consider. Set
   * to -1 to consider all tokens.
   */
  top_k?: number;

  /**
   * Float that represents the minimum probability for a token to be
   * considered, relative to the probability of the most likely token.
   * Must be in [0, 1]. Set to 0 to disable this.
   */
  min_p?: number;

  /**
   * Random seed to use for the generation.
   */
  seed?: number;

  /**
   * Whether to use beam search instead of sampling.
   */
  use_beam_search?: boolean;

  /**
   * Float that penalizes sequences based on their length.
   * Used in beam search.
   */
  length_penalty?: number;

  /**
   * Controls the stopping condition for beam search.
   * It accepts the following values: `True`, where the generation stops as
   * soon as there are `best_of` complete candidates; `False`, where an
   * heuristic is applied and the generation stops when it is very
   * unlikely to find better candidates; `"never"`, where the beam search
   * procedure only stops when there cannot be better candidates
   * (canonical beam search algorithm).
   */
  early_stopping?: boolean;

  /**
   * List of strings that stop the generation when they are generated.
   * The returned output will not contain the stop strings.
   */
  stop?: Array<string>;

  /**
   * List of tokens that stop the generation when they are generated.
   * The returned output will contain the stop tokens unless
   * the stop tokens are special tokens.
   */
  stop_token_ids?: Array<number>;

  /**
   * Whether to include the stop strings in
   * output text. Defaults to False.
   */
  include_stop_str_in_output?: boolean;

  /**
   * Whether to ignore the EOS token and continue generating
   * tokens after the EOS token is generated.
   */
  ignore_eos?: boolean;

  /**
   * Maximum number of tokens to generate per output sequence.
   */
  max_tokens?: number;

  /**
   * Minimum number of tokens to generate per output sequence
   * before EOS or stop_token_ids can be generated.
   */
  min_tokens?: number;

  /**
   * Number of log probabilities to return per output token.
   * Note that the implementation follows the OpenAI API: The return
   * result includes the log probabilities on the `logprobs` most likely
   * tokens, as well the chosen tokens. The API will always return the
   * log probability of the sampled token, so there may be up to
   * `logprobs+1` elements in the response.
   */
  logprobs?: number;

  /**
   * Number of log probabilities to return per prompt token.
   */
  prompt_logprobs?: number;

  /**
   * Whether to detokenize the output. Defaults to True.
   */
  detokenize?: boolean;

  /**
   * Whether to skip special tokens in the output.
   */
  skip_special_tokens?: boolean;

  /**
   * Whether to add spaces between special
   * tokens in the output. Defaults to True.
   */
  spaces_between_special_tokens?: boolean;

  /**
   * List of functions that modify logits based on
   * previously generated tokens, and optionally prompt tokens as
   * a first argument.
   */
  logits_processors?: Array<Function>;

  /**
   * If set to an integer k, will use only the last k
   * tokens from the prompt (i.e., left truncation). Defaults to None
   * (i.e., no truncation).
   */
  truncate_prompt_tokens?: number;
}

interface ChatCompletionChunkStreamParams {
  id?: string;
  object?: string;
  created?: number;
  model: string;
  system_fingerprint?: string;
  choices?: ChoiceStream[];
  streamResponse: string;
  finishReason?: any;
}

interface ChoiceStream {
  index: number;
  delta: Message;
  logprobs: any;
  finish_reason: any;
}

export class ChatCompletionChunkStreamClass {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  system_fingerprint?: string;
  choices: ChoiceStream[];
  streamResponse: string;
  finishReason: any;

  constructor({
    id = '',
    created = Math.floor(Date.now() / 1000),
    model,
    system_fingerprint,
    streamResponse,
    finishReason = null,
  }: ChatCompletionChunkStreamParams) {
    this.id = id;
    this.object = 'chat.completion.chunk' as const;
    this.created = created;
    this.model = model;
    this.system_fingerprint = system_fingerprint;
    this.streamResponse = streamResponse;
    this.finishReason = finishReason;
    this.choices = [
      {
        index: 0,
        delta: new Message(streamResponse),
        logprobs: null,
        finish_reason: finishReason,
      },
    ];
  }

  getChoices(): ChoiceStream[] {
    return this.choices;
  }
}

export type ModelDataDetails = {
  url: string;
  adapter_name: string;
};

export type ModelData = {
  [key: string]: ModelDataDetails;
};
