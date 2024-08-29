import { dataURL, baseURL } from '../constants';
import { FilterType } from './fineTuningModels';

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

export async function saveLogs({
  filename,
  tags,
  tromeroKey,
  makeSyntheticVersion = false,
}: {
  filename: string;
  tags: string[];
  tromeroKey: string;
  makeSyntheticVersion?: boolean;
}): Promise<any> {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-API-KEY': tromeroKey,
  });
  const data = {
    custom_logs_filename: filename,
    save_logs_with_tags: tags,
    make_synthetic_version: makeSyntheticVersion,
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

interface DeployResponse {
  message: string;
  status: string;
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
): Promise<DeployResponse> {
  const headers = new Headers({
    'X-API-KEY': tromeroKey,
    'Content-Type': 'application/json',
  });

  const response = await fetch(`${baseURL}/deploy_model`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model_name: modelName }),
  });

  if (!response.ok) {
    throw new Error(
      `HTTP error! status: ${response.status}, ${response.statusText}`
    );
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
    throw new Error(
      `HTTP error! status: ${response.status}, ${response.statusText}`
    );
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
    body: JSON.stringify({ model_name: modelName }),
  });

  if (!response.ok) {
    throw new Error(
      `HTTP error! status: ${response.status}, ${response.statusText}`
    );
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

export async function createDataset({
  name,
  description,
  filters,
  tromeroKey,
}: {
  name: string;
  description?: string;

  filters: FilterType;
  tromeroKey: string;
}): Promise<any> {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-API-KEY': tromeroKey,
  });
  if (typeof filters.models === 'string') {
    filters.models = [filters.models];
  }
  if (typeof filters.tags === 'string') {
    filters.tags = [filters.tags];
  }
  const data = { name, description, ...filters };

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
