import * as openai from 'openai';
import * as Core from 'openai/core';
import { Stream } from 'openai/streaming';
import { ChatCompletionCreateParamsNonStreaming, ChatCompletion as ChatCompletion$1, ChatCompletionCreateParamsStreaming, ChatCompletionChunk as ChatCompletionChunk$1, ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';
import { ChatCompletionChunk, ChatCompletion } from 'openai/resources/chat';

type TromeroCompletionArgs = {
    saveData?: boolean;
    tags?: string[];
    fallbackModel?: string;
};

/**
 * A mock stream that saves the final completion to a file.
 * @param stream - The stream to mock.
 * @param saveData - The function to save the completion data.
 * @returns The mock stream.
 */
declare class MockStream extends Stream<ChatCompletionChunk> {
    private saveData;
    constructor(stream: Stream<ChatCompletionChunk>, saveData: (response: ChatCompletion | null) => Promise<string>);
    [Symbol.asyncIterator](): AsyncIterator<ChatCompletionChunk, any, undefined>;
}

interface TromeroAIOptions {
    apiKey: string;
    baseURL?: string;
    dataURL?: string;
}
interface ApiResponse {
    error?: string;
    status_code: string | number;
    [key: string]: any;
}
declare class TromeroClient {
    private dataURL;
    private baseURL;
    private apiKey;
    modelUrls: {
        [key: string]: string;
    };
    baseModel: {
        [key: string]: any;
    };
    constructor({ apiKey, baseURL, dataURL, }: TromeroAIOptions);
    private fetchData;
    postData(data: any): Promise<ApiResponse>;
    getModelUrl(modelName: string): Promise<ApiResponse>;
    mockOpenAIFormatStream(messages: string): any;
    streamResponse(response: Response): AsyncGenerator<any, void, unknown>;
    create(model: string, modelUrl: string, messages: any[], parameters?: any): Promise<ApiResponse>;
}

interface TromeroOptions extends openai.ClientOptions {
    apiKey?: string;
    tromeroKey: string | undefined;
    saveData?: boolean;
}
declare class Tromero extends openai.OpenAI {
    tromeroClient?: TromeroClient;
    constructor({ tromeroKey, apiKey, ...opts }: TromeroOptions);
    chat: MockChat;
}
declare class MockChat extends openai.OpenAI.Chat {
    completions: MockCompletions;
    constructor(client: openai.OpenAI);
    setClient(client: TromeroClient): void;
}
declare class MockCompletions extends openai.OpenAI.Chat.Completions {
    openaiClient: openai.OpenAI;
    tromeroClient: TromeroClient | undefined;
    constructor(client: openai.OpenAI);
    setTromeroClient(client: TromeroClient): void;
    private choiceToDict;
    private saveDataOnServer;
    private formatKwargs;
    private formatMessages;
    private isModelFromOpenAi;
    _create(body: ChatCompletionCreateParamsNonStreaming, options?: Core.RequestOptions): Core.APIPromise<ChatCompletion$1>;
    _create(body: ChatCompletionCreateParamsStreaming, options?: Core.RequestOptions): Core.APIPromise<Stream<ChatCompletionChunk$1>>;
    create(body: ChatCompletionCreateParamsNonStreaming & TromeroCompletionArgs, options?: Core.RequestOptions): Core.APIPromise<ChatCompletion$1>;
    create(body: ChatCompletionCreateParamsStreaming & TromeroCompletionArgs, options?: Core.RequestOptions): Core.APIPromise<MockStream>;
    create(body: ChatCompletionCreateParamsBase & TromeroCompletionArgs, options?: Core.RequestOptions): Core.APIPromise<Stream<ChatCompletionChunk$1> | ChatCompletion$1>;
}

export { Tromero as default };
