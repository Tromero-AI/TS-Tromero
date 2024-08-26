import {
  getSignedUrl,
  uploadFileToUrl,
  saveLogs,
  createFineTuningJob,
  getModelTrainingInfo,
  getModels,
  deployModelRequest,
  getModelRequest,
  undeployModelRequest,
  getTags,
  createDataset,
  modelEvaluationRequest,
} from './fineTuningRequests';

import { tagsToString, validateFileContent } from '../tromeroUtils';
import { Model, TrainingMetrics, Dataset } from './fineTuningModels';
import { v4 as uuidv4 } from 'uuid';

function setRaw<T>(val: T | undefined, defaultVal: T): T {
  return val !== undefined ? val : defaultVal;
}

interface DatasetInterface {
  tromeroKey: string;
  rawDefault?: boolean;
}

export class Datasets implements DatasetInterface {
  tromeroKey: string;
  rawDefault: boolean;

  constructor(tromeroKey: string, rawDefault: boolean = false) {
    this.tromeroKey = tromeroKey;
    this.rawDefault = rawDefault;
  }

  async createFromFile(
    filePath: string,
    name: string,
    description: string,
    tags: string[] | string
  ): Promise<boolean | undefined> {
    const idTag = `dataset_tag_${uuidv4()}`;
    if (typeof tags === 'string') {
      tags = [tags];
    }
    tags.push(idTag);
    if (!validateFileContent(filePath)) {
      return;
    }
    const { signedUrl, filename } = await getSignedUrl(this.tromeroKey);
    await uploadFileToUrl(signedUrl, filePath);
    await saveLogs(filename, tags, this.tromeroKey);
    console.log(`File uploaded successfully! Tags: ${tags}`);
    await createDataset(name, description, [idTag], this.tromeroKey);
    return true;
  }

  async createFromTags(
    name: string,
    description: string,
    tags: string[]
  ): Promise<boolean> {
    createDataset(name, description, tags, this.tromeroKey);
    return true;
  }

  async list(raw?: boolean): Promise<Dataset[]> {
    raw = setRaw(raw, this.rawDefault);
    const response = await getTags(this.tromeroKey);
    const datasets = response.datasets || [];
    if (raw) {
      return datasets;
    }
    return datasets.map((dataset: any) => new Dataset(dataset));
  }
}

interface FineTuningJobInterface {
  tromeroKey: string;
  rawDefault?: boolean;
}

export class FineTuningJob implements FineTuningJobInterface {
  tromeroKey: string;
  rawDefault: boolean;

  constructor(tromeroKey: string, rawDefault: boolean = false) {
    this.tromeroKey = tromeroKey;
    this.rawDefault = rawDefault;
  }

  async create(
    modelName: string,
    baseModel: string,
    parameters?: any
  ): Promise<any> {
    const data: any = { modelName, baseModel };
    if (parameters) {
      if (typeof parameters === 'string') {
        parameters = JSON.parse(parameters);
        console.log(parameters);
      }
      Object.assign(data, parameters);
    }
    const response = await createFineTuningJob(data, this.tromeroKey);
    return response;
  }

  async getMetrics(
    modelName: string,
    raw?: boolean
  ): Promise<TrainingMetrics | any> {
    raw = setRaw(raw, this.rawDefault);
    const response = await getModelTrainingInfo(modelName, this.tromeroKey);
    const metrics = response.metrics || {};
    if (!metrics) {
      console.log('Metrics are not available for this model yet.');
    }
    if (raw) {
      return metrics;
    }
    return new TrainingMetrics(metrics);
  }
}

interface TromeroModelsInterface {
  tromeroKey: string;
  rawDefault?: boolean;
}

export class TromeroModels implements TromeroModelsInterface {
  tromeroKey: string;
  rawDefault: boolean;

  constructor(tromeroKey: string, rawDefault: boolean = false) {
    this.tromeroKey = tromeroKey;
    this.rawDefault = rawDefault;
  }

  async list(raw?: boolean): Promise<Model[] | any[]> {
    raw = setRaw(raw, this.rawDefault);
    const response = await getModels(this.tromeroKey);
    if (raw) {
      return response.message;
    }
    return Array.isArray(response.message)
      ? response.message.map((model: Model) => new Model(model))
      : [];
  }

  deploy(modelName: string): any {
    return deployModelRequest(modelName, this.tromeroKey);
  }

  getInfo(modelName: string, raw?: boolean): Model | any {
    raw = setRaw(raw, this.rawDefault);
    const response = getModelRequest(modelName, this.tromeroKey);
    if (raw) {
      return response;
    }
    return new Model(response.message);
  }

  undeploy(modelName: string): any {
    return undeployModelRequest(modelName, this.tromeroKey);
  }
}

interface TromeroDataInterface {
  tromeroKey: string;
}

export class TromeroData implements TromeroDataInterface {
  tromeroKey: string;

  constructor(tromeroKey: string) {
    this.tromeroKey = tromeroKey;
  }

  upload(
    filePath: string,
    tags: string[] | string,
    makeSyntheticVersion: boolean = false
  ): boolean | undefined {
    if (typeof tags === 'string') {
      tags = [tags];
    }
    if (!validateFileContent(filePath)) {
      return;
    }
    const [signedUrl, filename] = getSignedUrl(this.tromeroKey);
    uploadFileToUrl(signedUrl, filePath);
    saveLogs(filename, tags, this.tromeroKey, makeSyntheticVersion);
    console.log(`File uploaded successfully! Tags: ${tags}`);
    return true;
  }

  getTags(): string[] {
    const response = getTags(this.tromeroKey);
    return response.message;
  }
}
