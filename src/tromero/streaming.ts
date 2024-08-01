import { Readable } from 'stream';
import type {
  ChatCompletion,
  ChatCompletionChunk,
} from 'openai/resources/chat';
import { ChatCompletionChunkStreamClass } from '../tromeroUtils';

// export class StreamResponse {
//   private response: ReadableStream;

//   constructor(response: ReadableStream) {
//     this.response = response;
//     console.log('StreamResponse constructor', response);
//   }

//   async *[Symbol.asyncIterator](): AsyncIterableIterator<string> {
//     try {
//       let lastChunk: string | null = null;

//       for await (const chunk of this.response) {
//         const chunkStr = chunk.toString('utf-8');
//         lastChunk = chunkStr.slice(5); // Assuming the first 5 characters are not needed
//         try {
//           const chunkDict = JSON.parse(lastChunk as string);
//           const formattedChunk = this.mockOpenAiFormatStream(
//             chunkDict.token.text
//           );
//           yield formattedChunk;
//         } catch (error) {
//           console.error(`Error parsing JSON: ${error}`);
//           continue;
//         }
//       }
//     } catch (error) {
//       console.error(`Error: ${error}`);
//     }
//   }

//   private mockOpenAiFormatStream(text: string): string {
//     return text.trim();
//   }
// }

interface Chunk {
  token: { text: string; special: boolean };
}

interface OpenAIChunk {
  choices: Array<{
    delta: {
      content: string | null;
    };
  }>;
}

export class StreamResponse {
  private response: ReadableStream;
  private model: string;

  constructor(response: ReadableStream, model: string) {
    this.response = response;
    this.model = model;
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<ChatCompletionChunk> {
    const reader = this.response.getReader();
    try {
      let fullText: string = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        let chunkStr = new TextDecoder('utf-8').decode(value);
        try {
          chunkStr = chunkStr.slice(5);
          const chunkDict: Chunk = JSON.parse(chunkStr);

          if (!chunkDict || !chunkDict.token) {
            console.error('Invalid chunkDict or token structure', chunkDict);
            continue;
          }

          const responseChunk = new ChatCompletionChunkStreamClass({
            model: this.model,
            streamResponse: chunkDict.token.text,
            finishReason: chunkDict.token.special ? 'stop' : null,
          });
          yield responseChunk;
          const content = chunkDict.token.text;
          if (content) {
            // console.log('content', content);
            fullText += content;
            // yield content;
          }
          // console.log('fullText', fullText);
        } catch (error) {
          console.error(`Error parsing JSON: ${error}`);
          continue;
        }
      }

      // console.log('fullText', fullText);
    } catch (error) {
      console.error(`Error: ${error}`);
    } finally {
      reader.releaseLock();
    }
  }

  private mockOpenAiFormatStream(text: string): string {
    return text.trim();
  }
}

// export class StreamResponse {
//   private response: ReadableStream;
//   private model: string;

//   constructor(response: ReadableStream, model: string) {
//     this.response = response;
//     this.model = model;

//     // Start processing the stream immediately upon object creation
//     this.initialize();
//   }

//   private async initialize() {
//     await this.processStream();
//   }

//   private async processStream() {
//     const reader = this.response.getReader();
//     let fullText: string = '';

//     try {
//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;

//         let chunkStr = new TextDecoder('utf-8').decode(value);
//         console.log('chunkStr:', chunkStr);
//         try {
//           chunkStr = chunkStr.slice(5); // Adjust based on your data structure
//           const chunkDict: Chunk = JSON.parse(chunkStr);

//           if (!chunkDict || !chunkDict.token) {
//             console.error('Invalid chunkDict or token structure', chunkDict);
//             continue;
//           }

//           const responseChunk = new ChatCompletionChunkStreamClass({
//             model: this.model,
//             streamResponse: chunkDict.token.text,
//             finishReason: chunkDict.token.special ? 'stop' : null,
//           });

//           // Process responseChunk as needed internally
//           console.log('Processing chunk:', responseChunk);

//           const content = chunkDict.token.text;
//           if (content) {
//             fullText += content;
//           }
//         } catch (error) {
//           console.error(`Error parsing JSON: ${error}`);
//           continue;
//         }
//       }
//     } catch (error) {
//       console.error(`Error during stream reading: ${error}`);
//     } finally {
//       reader.releaseLock();
//     }

//     // Handle final fullText or other post-processing if necessary
//     console.log('Final fullText:', fullText);
//   }

//   private mockOpenAiFormatStream(text: string): string {
//     return text.trim();
//   }
// }
