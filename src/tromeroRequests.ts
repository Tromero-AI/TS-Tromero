import axios, { AxiosResponse } from 'axios';

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
    const response: AxiosResponse = await axios.post(dataUrl, data, {
      headers,
    });
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
  messages: string[],
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
    const response: AxiosResponse = await axios.post(
      `${modelUrl}/generate`,
      data,
      {
        headers,
      }
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
    const response = await axios.get(`${baseUrl}/model/${modelName}/url`, {
      headers: {
        'X-API-KEY': authToken,
        'Content-Type': 'application/json',
      },
    });
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
