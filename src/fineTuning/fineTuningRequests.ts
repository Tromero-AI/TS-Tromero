import { dataURL, baseURL } from '../constants';

interface GenericRequestParams {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  data?: any;
  tromeroKey: string;
}

async function genericRequest({
  method,
  path,
  data,
  tromeroKey,
}: GenericRequestParams): Promise<any> {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-API-KEY': tromeroKey,
  });

  const options: RequestInit = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${baseURL}${path}`, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function getSignedUrl(
  authToken: string
): Promise<{ signedUrl: string; filename: string }> {
  const headers = new Headers({
    'X-API-KEY': authToken,
    'Content-Type': 'application/json',
  });

  const response = await fetch(`${baseURL}/generate_signed_url`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return { signedUrl: data.signedUrl, filename: data.filename };
}

export async function uploadFileToUrl(
  signedUrl: string,
  filePath: string
): Promise<void> {
  const response = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: await fetch(filePath).then((res) => res.blob()),
  });

  if (!response.ok) {
    throw new Error(`An error occurred in upload: ${response.statusText}`);
  }
}

export async function saveLogs(
  customLogsFilename: string,
  saveLogsWithTags: string[],
  tromeroKey: string,
  makeSyntheticVersion: boolean = false
): Promise<any> {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-API-KEY': tromeroKey,
  });
  const data = {
    customLogsFilename,
    saveLogsWithTags,
    makeSyntheticVersion,
  };

  const response = await fetch(`${baseURL}/custom_log_upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function createFineTuningJob(
  data: any,
  tromeroKey: string
): Promise<any> {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-API-KEY': tromeroKey,
  });

  const response = await fetch(`${baseURL}/training-pod`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

interface GetModelsResponse {
  message: any;
  [key: string]: unknown;
}

export async function getModels(
  tromeroKey: string
): Promise<GetModelsResponse> {
  const headers = new Headers({
    'X-API-KEY': tromeroKey,
    'Content-Type': 'application/json',
  });

  const response = await fetch(`${baseURL}/models?show_full=true`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function getModelTrainingInfo(
  modelName: string,
  tromeroKey: string
): Promise<any> {
  const headers = new Headers({
    'X-API-KEY': tromeroKey,
    'Content-Type': 'application/json',
  });

  const response = await fetch(
    `${baseURL}/named-training-info-log/${modelName}`,
    { method: 'GET', headers }
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function deployModelRequest(
  modelName: string,
  tromeroKey: string
): Promise<any> {
  const headers = new Headers({
    'X-API-KEY': tromeroKey,
    'Content-Type': 'application/json',
  });

  const response = await fetch(`${baseURL}/deploy_model`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ modelName }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function getModelRequest(
  modelName: string,
  tromeroKey: string
): Promise<any> {
  const headers = new Headers({
    'X-API-KEY': tromeroKey,
    'Content-Type': 'application/json',
  });

  const response = await fetch(`${baseURL}/models/by_name/${modelName}`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function undeployModelRequest(
  modelName: string,
  tromeroKey: string
): Promise<any> {
  const headers = new Headers({
    'X-API-KEY': tromeroKey,
    'Content-Type': 'application/json',
  });

  const response = await fetch(`${baseURL}/undeploy_model`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ modelName }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function getTags(tromeroKey: string): Promise<any> {
  const headers = new Headers({ 'X-API-KEY': tromeroKey });

  const response = await fetch(`${baseURL}/tags`, { method: 'GET', headers });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function createDataset(
  name: string,
  description: string,
  tags: string[],
  tromeroKey: string
): Promise<any> {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-API-KEY': tromeroKey,
  });
  const data = { name, description, tags };

  const response = await fetch(`${baseURL}/datasets`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function modelEvaluationRequest(
  modelName: string,
  tromeroKey: string
): Promise<any> {
  return genericRequest({
    method: 'GET',
    path: `/evaluate/named/${modelName}`,
    tromeroKey,
  });
}
