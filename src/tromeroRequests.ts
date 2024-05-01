import axios, { AxiosResponse } from 'axios';

const dataUrl = 'https://midyear-grid-402910.lm.r.appspot.com/tailor/v1/data';
const modelsUrl = 'http://87.120.209.240:5000/generate';

export async function postData(data: any, authToken: string): Promise<any> {
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
  messages: string[],
  tromeroKey: string
): Promise<any> {
  const headers = {
    Authorization: `Bearer ${tromeroKey}`,
    'Content-Type': 'application/json',
  };

  const data = {
    adapter_name: model,
    messages: messages,
  };

  try {
    const response: AxiosResponse = await axios.post(modelsUrl, data, {
      headers,
    });
    return response.data; // Return the JSON response if successful
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
