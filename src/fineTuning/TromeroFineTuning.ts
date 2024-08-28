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
/**
 * Sets the value of `val` to `defaultVal` if `val` is undefined.
 * @template T
 * @param {T | undefined} val - The value to check.
 * @param {T} defaultVal - The default value to use if `val` is undefined.
 * @returns {T} - The resolved value.
 */
function setRaw<T>(val: T | undefined, defaultVal: T): T {
  return val !== undefined ? val : defaultVal;
}

export class TromeroDatasets {
  private rawDefault: boolean;
  private tromeroKey: string;

  /**
   * Creates an instance of TromeroDatasets.
   * @param {string} tromeroKey - The API key for Tromero.
   * @param {boolean} [rawDefault=false] - The default value for raw.
   */
  constructor(tromeroKey: string, rawDefault: boolean = false) {
    this.tromeroKey = tromeroKey;
    this.rawDefault = rawDefault;
  }

  /**
   * Creates a dataset from uploading a file. The file will be validated before being uploaded. The tags are used to reference the dataset.
   * @param {string} filePath - The path to the file.
   * @param {string} name - The name of the dataset.
   * @param {string} description - The description of the dataset.
   * @param {string[] | string} tags - The tags for the dataset.
   * @returns {Promise<boolean | undefined>} - A promise that resolves to true if successful, undefined otherwise.
   */
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

  /**
   * Creates a dataset using tags.
   * @param {string} name - The name of the dataset.
   * @param {string} description - The description of the dataset.
   * @param {string[]} tags - The tags for the dataset.
   * @returns {Promise<boolean>} - A promise that resolves to true if successful.
   */
  async createFromTags(
    name: string,
    description: string,
    tags: string[]
  ): Promise<boolean> {
    await createDataset(name, description, tags, this.tromeroKey);
    return true;
  }

  /**
   * Lists the datasets.
   * @param {boolean} [raw] - Whether to return the raw data or not.
   * @returns {Promise<Dataset[]>} - A promise that resolves to an array of datasets.
   */
  async list(raw?: boolean): Promise<Dataset[]> {
    raw = setRaw(raw, this.rawDefault);
    const response = await getTags(this.tromeroKey);
    const datasets = response.datasets || [];
    if (raw) {
      return datasets;
    }
    return datasets.map((dataset: any) => new Dataset(dataset));
  }

  /**
   * Retrieves the tags associated with the data.
   * @returns {Promise<string[]>} - A promise that resolves to an array of tags.
   */
  async getTags(): Promise<string[]> {
    const response = await getTags(this.tromeroKey);
    return response.message;
  }
}

export class FineTuningJob {
  private tromeroKey: string;
  private rawDefault: boolean;

  /**
   * Creates an instance of FineTuningJob.
   * @param {string} tromeroKey - The API key for Tromero.
   * @param {boolean} [rawDefault=false] - The default value for raw.
   */
  constructor(tromeroKey: string, rawDefault: boolean = false) {
    this.tromeroKey = tromeroKey;
    this.rawDefault = rawDefault;
  }

  /**
   * Creates a fine-tuning job.
   * @param {string} modelName - The name of the model to fine-tune.
   * @param {string} baseModel - The base model to fine-tune.
   * @param {Object} [parameters] - Additional parameters for the fine-tuning job.
   * @returns {Promise<any>} - A promise that resolves to the response of the fine-tuning job creation.
   */
  async create(
    modelName: string,
    baseModel: string,
    parameters?: any
  ): Promise<any> {
    const data: any = { modelName, baseModel };
    if (parameters) {
      if (typeof parameters === 'string') {
        parameters = await JSON.parse(parameters);
        console.log(parameters);
      }
      Object.assign(data, parameters);
    }
    const response = await createFineTuningJob(data, this.tromeroKey);
    return response;
  }

  /**
   * Retrieves the training metrics for a model.
   * @param {string} modelName - The name of the model.
   * @param {boolean} [raw] - Whether to return the raw data or not.
   * @returns {Promise<TrainingMetrics | any>} - A promise that resolves to the training metrics.
   */
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

export class TromeroModels {
  private rawDefault: boolean;
  private tromeroKey: string;

  /**
   * Creates an instance of TromeroModels.
   * @param {string} tromeroKey - The API key for Tromero.
   * @param {boolean} [rawDefault=false] - The default value for raw.
   */
  constructor(tromeroKey: string, rawDefault: boolean = false) {
    this.tromeroKey = tromeroKey;
    this.rawDefault = rawDefault;
  }

  /**
   * Lists the available models.
   * @param {boolean} [raw] - Whether to return the raw data or not.
   * @returns {Promise<Model[]>} - A promise that resolves to an array of models.
   */
  async list(raw?: boolean): Promise<Model[]> {
    raw = setRaw(raw, this.rawDefault);
    const response = await getModels(this.tromeroKey);

    if (raw) {
      return response.message;
    }
    return Array.isArray(response.message)
      ? response.message.map((model: Model) => new Model(model))
      : [];
  }

  /**
   * Deploys a model.
   * @param {string} modelName - The name of the model to deploy.
   * @returns {Promise<any>} - A promise that resolves to the response of the deploy request.
   */
  async deploy(modelName: string): Promise<any> {
    return await deployModelRequest(modelName, this.tromeroKey);
  }

  /**
   * Retrieves information about a model.
   * @param {string} modelName - The name of the model.
   * @param {boolean} [raw] - Whether to return the raw data or not.
   * @returns {Promise<Model>} - A promise that resolves to the model information.
   */
  async getInfo(modelName: string, raw?: boolean): Promise<Model> {
    raw = setRaw(raw, this.rawDefault);
    const response = await getModelRequest(modelName, this.tromeroKey);
    if (raw) {
      return response;
    }
    return new Model(response.message);
  }

  /**
   * Undeploys a model.
   * @param {string} modelName - The name of the model to undeploy.
   * @returns {Promise<any>} - A promise that resolves to the response of the undeploy request.
   */
  async undeploy(modelName: string): Promise<any> {
    return await undeployModelRequest(modelName, this.tromeroKey);
  }
}

export class TromeroData {
  private tromeroKey: string;

  /**
   * Creates an instance of TromeroData.
   * @param {string} tromeroKey - The API key for Tromero.
   */
  constructor(tromeroKey: string) {
    this.tromeroKey = tromeroKey;
  }

  /**
   * Uploads a file and optionally creates a synthetic version.
   * @param {string} filePath - The path to the file.
   * @param {string[] | string} tags - The tags associated with the file.
   * @param {boolean} [makeSyntheticVersion=false] - Whether to create a synthetic version of the file.
   * @returns {Promise<boolean | undefined>} - A promise that resolves to true if successful, undefined otherwise.
   */
  async upload(
    filePath: string,
    tags: string[] | string,
    makeSyntheticVersion: boolean = false
  ): Promise<boolean | undefined> {
    if (typeof tags === 'string') {
      tags = [tags];
    }
    if (!validateFileContent(filePath)) {
      return;
    }
    const { signedUrl, filename } = await getSignedUrl(this.tromeroKey);
    uploadFileToUrl(signedUrl, filePath);
    saveLogs(filename, tags, this.tromeroKey, makeSyntheticVersion);
    console.log(`File uploaded successfully! Tags: ${tags}`);
    return true;
  }

  /**
   * Retrieves the tags associated with the data.
   * @returns {Promise<string[]>} - A promise that resolves to an array of tags.
   */
  async getTags(): Promise<string[]> {
    const response = await getTags(this.tromeroKey);
    return response.message;
  }
}
