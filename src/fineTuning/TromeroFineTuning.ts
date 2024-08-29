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
import {
  Model,
  TrainingMetrics,
  Dataset,
  FineTuneOptions,
  FineTuneWithCustomDataset,
  FineTuneWithTags,
  FineTuneCreateParams,
} from './fineTuningModels';
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
    tags: string[] | string,
    skipLogsWithErrors: boolean = true
  ): Promise<boolean | undefined> {
    const idTag = `dataset_tag_${uuidv4()}`;
    if (typeof tags === 'string') {
      tags = [tags];
    }
    tags.push(idTag);
    if (!validateFileContent(filePath, skipLogsWithErrors)) {
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

export class TromeroFineTuningJob {
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
   * Creates a fine-tuning job with tags.
   *
   * @param {Object} options - An object containing the options for creating the fine-tuning job.
   * @param {string} options.modelName - The name to assign to the fine-tuned model.
   * @param {string} options.baseModel - The base model to fine-tune.
   * @param {string[]} options.tags - An array of tags representing the dataset to fine-tune the model on. Must be tags that are already associated with data in Tromero.
   * @param {number} [options.batch_size] - The batch size to use for fine-tuning. Leave empty for the default value.
   * @param {number} [options.epoch] - The number of epochs to use for fine-tuning. Leave empty for the default value.
   * @param {number} [options.learning_rate] - The learning rate to use for fine-tuning. Leave empty for the default value.
   * @param {boolean} [options.skip_logs_with_errors=true] - Whether to skip logs with errors during the fine-tuning process. Defaults to true.
   *
   * @returns {Promise<any>} A promise that resolves to the response of the fine-tuning job creation.
   */
  create({ ...options }: FineTuneWithTags): Promise<any>;
  /**
   * Creates a fine-tuning job with a custom dataset.
   *
   * @param {Object} options - An object containing the options for creating the fine-tuning job.
   * @param {string} options.modelName - The name to assign to the fine-tuned model.
   * @param {string} options.baseModel - The base model to fine-tune.
   * @param {string} options.custom_dataset - A custom dataset to fine-tune the model on. Must be the name of a dataset that is already associated with data in Tromero.
   * @param {number} [options.batch_size] - The batch size to use for fine-tuning. Leave empty for the default value.
   * @param {number} [options.epoch] - The number of epochs to use for fine-tuning. Leave empty for the default value.
   * @param {number} [options.learning_rate] - The learning rate to use for fine-tuning. Leave empty for the default value.
   * @param {boolean} [options.skip_logs_with_errors=true] - Whether to skip logs with errors during the fine-tuning process. Defaults to true.
   *
   * @returns {Promise<any>} A promise that resolves to the response of the fine-tuning job creation.
   */
  create({ ...options }: FineTuneWithCustomDataset): Promise<any>;
  /**
   * Creates a fine-tuning job.
   *
   * @param {FineTuneOptions} options - An object containing the options for creating the fine-tuning job. The object should include the following properties:
   * - If using tags:
   *   @param {string[]} options.tags - An array of tags representing the dataset to fine-tune the model on.
   * - If using a custom dataset:
   *   @param {string} options.custom_dataset - A custom dataset to fine-tune the model on.
   *
   * Common options:
   * @param {string} options.modelName - The name to assign to the fine-tuned model.
   * @param {string} options.baseModel - The base model to fine-tune.
   * @param {number} [options.batch_size] - The batch size to use for fine-tuning. Leave empty for the default value.
   * @param {number} [options.epoch] - The number of epochs to use for fine-tuning. Leave empty for the default value.
   * @param {number} [options.learning_rate] - The learning rate to use for fine-tuning. Leave empty for the default value.
   * @param {boolean} [options.skip_logs_with_errors=true] - Whether to skip logs with errors during the fine-tuning process. Defaults to true.
   *
   * @returns {Promise<any>} A promise that resolves to the response of the fine-tuning job creation.
   *
   * @throws {Error} If neither `tags` nor `custom_dataset` is provided.
   */
  async create({ ...options }: FineTuneOptions): Promise<any> {
    const { modelName, baseModel, ...rest } = options;
    const data: FineTuneCreateParams & {
      tags?: string[];
      custom_dataset?: string;
    } = {
      modelName,
      baseModel,
    };

    if ('tags' in options) {
      if (typeof options.tags === 'string') {
        data.tags = [options.tags];
      } else {
        data.tags = options.tags;
      }
    } else if ('custom_dataset' in options) {
      data.custom_dataset = options.custom_dataset;
    } else {
      throw new Error('Either tags or custom_dataset must be provided.');
    }

    if ('batch_size' in rest) {
      data.batch_size = rest.batch_size;
    }

    if ('epoch' in rest) {
      data.epoch = rest.epoch;
    }

    if ('learning_rate' in rest) {
      data.learning_rate = rest.learning_rate;
    }

    if ('skip_logs_with_errors' in rest) {
      data.skip_logs_with_errors = rest.skip_logs_with_errors;
    }

    const response = await createFineTuningJob(data, this.tromeroKey);
    return response;
  }

  // /**
  //  * Creates a fine-tuning job.
  //  *
  //  * @param {Object} options - An object containing the options for creating the fine-tuning job. The object should include the following properties:
  //  * @param {string} options.modelName - The name to assign to the fine-tuned model.
  //  * @param {string} options.baseModel - The base model to fine-tune.
  //  * @param {string[]} [options.tags] - An array of tags representing the dataset to fine-tune the model on. Required if `custom_dataset` is not provided. Must be tags that are already associated with data in Tromero.
  //  * @param {string} [options.custom_dataset] - A custom dataset to fine-tune the model on. Required if `tags` is not provided. Must be the name of a dataset that is already associated with data in Tromero.
  //  * @param {number} [options.batch_size] - The batch size to use for fine-tuning. For default value, leave empty.
  //  * @param {number} [options.epoch] - The number of epochs to use for fine-tuning. For default value, leave empty.
  //  * @param {number} [options.learning_rate] - The learning rate to use for fine-tuning. For default value, leave empty.
  //  * @param {boolean} [options.skip_logs_with_errors=true] - Whether to skip logs with errors during the fine-tuning process. Defaults to true.
  //  *
  //  * @returns {Promise<any>} - A promise that resolves to the response of the fine-tuning job creation.
  //  */
  // async create({ ...options }: FineTuneOptions): Promise<any> {
  //   const { modelName, baseModel, ...rest } = options;
  //   const data: any = { modelName, baseModel };

  //   if ('tags' in options) {
  //     if (typeof options.tags === 'string') {
  //       options.tags = [options.tags];
  //     } else {
  //       data.tags = options.tags;
  //     }
  //   } else if ('custom_dataset' in options) {
  //     data.custom_dataset = options.custom_dataset;
  //   } else if (!('tags' in options) && !('custom_dataset' in options)) {
  //     throw new Error('Either tags or custom_dataset must be provided.');
  //   }

  //   if ('batch_size' in rest) {
  //     data.batch_size = rest.batch_size;
  //   } else {
  //     data.batch_size = '';
  //   }

  //   if ('epoch' in rest) {
  //     data.epoch = rest.epoch;
  //   } else {
  //     data.epoch = '';
  //   }

  //   if ('learning_rate' in rest) {
  //     data.learning_rate = rest.learning_rate;
  //   } else {
  //     data.learning_rate = '';
  //   }

  //   if ('skip_logs_with_errors' in rest) {
  //     data.skip_logs_with_errors = rest.skip_logs_with_errors;
  //   } else {
  //     data.skip_logs_with_errors = true;
  //   }

  //   const response = await createFineTuningJob(data, this.tromeroKey);
  //   return response;
  // }

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
   * Uploads a file with the specified options.
   *
   * @param {Object} options - The options for uploading the file.
   * @param {string} options.filePath - The path to the file in the local filesystem.
   * @param {string[] | string} options.tags - The tags to associate with the logs in the file.
   * @param {boolean} [options.makeSyntheticVersion=false] - Whether to create a synthetic version of the logs in the file. Defaults to false.
   * @param {boolean} [options.skipLogsWithErrors=true] - Whether to skip logs with errors during validation. Defaults to true.
   * @returns {Promise<boolean | undefined>} - A promise that resolves to true if successful, undefined otherwise.
   */
  async upload({
    filePath,
    tags,
    makeSyntheticVersion = false,
    skipLogsWithErrors = true,
  }: {
    filePath: string;
    tags: string[] | string;
    makeSyntheticVersion: boolean;
    skipLogsWithErrors: boolean;
  }): Promise<boolean | undefined> {
    if (typeof tags === 'string') {
      tags = [tags];
    }
    if (!validateFileContent(filePath, skipLogsWithErrors)) {
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
