import axios, { AxiosResponse } from 'axios';
import { mockOpenAIFormatStream, StreamResponseObject } from './tromeroUtils';
import { Readable } from 'stream';

const dataUrl = 'https://midyear-grid-402910.lm.r.appspot.com/tailor/v1/data';
const baseUrl = 'https://midyear-grid-402910.lm.r.appspot.com/tailor/v1';

interface ApiResponse {
  error?: string;
  status_code: string | number;
  [key: string]: any;
}

export async function postData(
  data: any,
  authToken: string
): Promise<ApiResponse> {
  const headers = {
    'X-API-KEY': authToken,
    'Content-Type': 'application/json',
  };

  try {
    const response: AxiosResponse<ApiResponse> = await axios.post(
      dataUrl,
      data,
      { headers }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response ? error.response.status : 'N/A';
      return {
        error: `An error occurred: ${error.message}`,
        status_code: statusCode,
      };
    }
    return { error: 'An unknown error occurred', status_code: 'N/A' };
  }
}

export async function tromeroModelCreate(
  model: string,
  modelUrl: string,
  messages: any[],
  tromeroKey: string,
  parameters: any = {}
): Promise<ApiResponse> {
  const headers = {
    'X-API-KEY': tromeroKey,
    'Content-Type': 'application/json',
  };

  const data = {
    adapter_name: model,
    messages: messages,
    parameters: parameters,
  };

  try {
    const response: AxiosResponse<ApiResponse> = await axios.post(
      `${modelUrl}/generate`,
      data,
      { headers }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response ? error.response.status : 'N/A';
      return {
        error: `An error occurred: ${error.message}`,
        status_code: statusCode,
      };
    }
    return { error: 'An unknown error occurred', status_code: 'N/A' };
  }
}

export async function getModelUrl(
  modelName: string,
  authToken: string
): Promise<ApiResponse> {
  try {
    const response: AxiosResponse<ApiResponse> = await axios.get(
      `${baseUrl}/model/${modelName}/url`,
      {
        headers: {
          'X-API-KEY': authToken,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        error: `An error occurred: ${error.message}`,
        status_code: error.response?.status.toString() ?? 'N/A',
      };
    }
    return { error: 'An unexpected error occurred', status_code: 'N/A' };
  }
}

class StreamResponse {
  private response: Readable;

  constructor(response: Readable) {
    this.response = response;
  }

  async *generator(): AsyncGenerator<StreamResponseObject, void, undefined> {
    let lastChunk = '';

    for await (const chunk of this.response) {
      const chunkStr = chunk.toString('utf-8');
      const jsonStr = chunkStr.slice(5);
      lastChunk = jsonStr;
      const pattern = /"token":({.*?})/;
      const match = pattern.exec(jsonStr);
      if (match) {
        const json = JSON.parse(match[1]);
        const formattedChunk = mockOpenAIFormatStream(json['text']);
        yield formattedChunk;
      } else {
        break;
      }
    }
  }
}

export const tromeroModelCreateStream = async (
  modelUrl: string,
  messages: { message: string }[],
  tromeroKey: string,
  {
    onData,
    onError,
    onEnd,
  }: {
    onData: (data: any) => void;
    onError: (error: Error) => void;
    onEnd: () => void;
  }
) => {
  try {
    const response = await axios.post(
      `${modelUrl}/generate`,
      { messages },
      {
        headers: {
          Authorization: `Bearer ${tromeroKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
      }
    );

    response.data.on('data', (chunk: Buffer) => {
      const parsedChunk = JSON.parse(chunk.toString());
      onData(parsedChunk);
    });

    response.data.on('end', () => {
      onEnd();
    });

    response.data.on('error', (err: Error) => {
      onError(err);
    });
  } catch (error) {
    onError(error as Error);
  }
};
