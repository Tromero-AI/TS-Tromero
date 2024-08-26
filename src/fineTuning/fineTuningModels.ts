interface ModelConfigParams {
  baseModel: string;
  batchSize?: number;
  epoch?: number;
  learningRate?: number;
  customDataset?: string;
  customLogsFilename?: string;
  numberOfBadLogs?: number;
  saveLogsWithTags?: string[];
  tags?: string[];
  externalServiceId?: string;
  podId?: string;
}

export class ModelConfig {
  baseModel: string;
  batchSize?: number;
  epoch?: number;
  learningRate?: number;
  customDataset?: string;
  customLogsFilename?: string;
  numberOfBadLogs?: number;
  saveLogsWithTags?: string[];
  tags?: string[];
  externalServiceId?: string;
  podId?: string;

  constructor(params: ModelConfigParams) {
    Object.assign(this, params);
    this.baseModel = params.baseModel;
  }
}

interface UsageDataParams {
  date: string;
  tokens: number;
}

export class UsageData {
  date: string;
  tokens: number;

  constructor(params: UsageDataParams) {
    this.date = params.date;
    this.tokens = params.tokens;
  }
}

interface BaseModelDataParams {
  availableForFinetuning: boolean;
  availableForInference: boolean;
  defaultBatchSize: number;
  defaultLr: number;
  displayName: string;
  hfRepo: string;
  id: string;
  modelName: string;
  modelSize: string;
  supportedContextLen: number;
  trainingTimePerLog: number;
  trainingTimeYIntercept: number;
}

export class BaseModelData {
  availableForFinetuning: boolean;
  availableForInference: boolean;
  defaultBatchSize: number;
  defaultLr: number;
  displayName: string;
  hfRepo: string;
  id: string;
  modelName: string;
  modelSize: string;
  supportedContextLen: number;
  trainingTimePerLog: number;
  trainingTimeYIntercept: number;

  constructor(params: BaseModelDataParams) {
    this.availableForFinetuning = params.availableForFinetuning;
    this.availableForInference = params.availableForInference;
    this.defaultBatchSize = params.defaultBatchSize;
    this.defaultLr = params.defaultLr;
    this.displayName = params.displayName;
    this.hfRepo = params.hfRepo;
    this.id = params.id;
    this.modelName = params.modelName;
    this.modelSize = params.modelSize;
    this.supportedContextLen = params.supportedContextLen;
    this.trainingTimePerLog = params.trainingTimePerLog;
    this.trainingTimeYIntercept = params.trainingTimeYIntercept;
  }
}

interface EvaluationStateParams {
  status: string;
}

export class EvaluationState {
  status: string;

  constructor(params: EvaluationStateParams) {
    this.status = params.status;
  }
}

interface ModelEvaluationStateParams {
  mixEval: EvaluationStateParams;
  needleHaystack: EvaluationStateParams;
}

export class ModelEvaluationState {
  mixEval: EvaluationState;
  needleHaystack: EvaluationState;

  constructor(params: ModelEvaluationStateParams) {
    this.mixEval = new EvaluationState(params.mixEval);
    this.needleHaystack = new EvaluationState(params.needleHaystack);
  }
}

interface ModelParams {
  modelId: string;
  modelName: string;
  state: string;
  modelConfig: ModelConfigParams;
  costPer1000Tokens?: number;
  createdAt?: string;
  createdAtUnix?: number;
  lastDeployedOn?: string;
  lastDeployedOnUnix?: number;
  lastUsed?: string;
  lastUsedUnix?: number;
  trainingEndedAt?: string;
  trainingEndedAtUnix?: number;
  updatedAt?: string;
  userId?: string;
  modelEvaluation?: any;
  selfHosted?: boolean;
  serverId?: string;
  usageData?: UsageDataParams[];
  baseModelData?: BaseModelDataParams;
  baseModelId?: string;
  modelEvaluationState?: ModelEvaluationStateParams;
}

export class Model {
  modelId: string;
  modelName: string;
  state: string;
  costPer1000Tokens: number;
  createdAt?: string;
  createdAtUnix?: number;
  lastDeployedOn?: string;
  lastDeployedOnUnix?: number;
  lastUsed?: string;
  lastUsedUnix?: number;
  trainingEndedAt?: string;
  trainingEndedAtUnix?: number;
  updatedAt?: string;
  userId?: string;
  modelEvaluation?: any;
  selfHosted: boolean;
  serverId?: string;
  usage: UsageData[];
  modelConfig: ModelConfig;
  baseModelData: BaseModelData;
  baseModelId?: string;
  modelEvaluationState: ModelEvaluationState;

  constructor(params: ModelParams) {
    this.modelId = params.modelId;
    this.modelName = params.modelName;
    this.state = params.state;
    this.costPer1000Tokens = params.costPer1000Tokens || 0;
    this.createdAt = params.createdAt;
    this.createdAtUnix = params.createdAtUnix;
    this.lastDeployedOn = params.lastDeployedOn;
    this.lastDeployedOnUnix = params.lastDeployedOnUnix;
    this.lastUsed = params.lastUsed;
    this.lastUsedUnix = params.lastUsedUnix;
    this.trainingEndedAt = params.trainingEndedAt;
    this.trainingEndedAtUnix = params.trainingEndedAtUnix;
    this.updatedAt = params.updatedAt;
    this.userId = params.userId;
    this.modelEvaluation = params.modelEvaluation;
    this.selfHosted = params.selfHosted || false;
    this.serverId = params.serverId;
    this.usage = (params.usageData || []).map((data) => new UsageData(data));
    this.modelConfig = new ModelConfig(params.modelConfig);
    this.baseModelData = new BaseModelData(params.baseModelData!);
    this.baseModelId = params.baseModelId;
    this.modelEvaluationState = new ModelEvaluationState(
      params.modelEvaluationState!
    );
  }
}

interface TrainingMetricsParams {
  evalLoss: number;
  loss: number;
  evalPerplexity: number;
  perplexity: number;
}

export class TrainingMetrics {
  evalLoss: number;
  loss: number;
  evalPerplexity: number;
  perplexity: number;

  constructor(params: TrainingMetricsParams) {
    this.evalLoss = params.evalLoss;
    this.loss = params.loss;
    this.evalPerplexity = params.evalPerplexity;
    this.perplexity = params.perplexity;
  }
}

interface FilterParams {
  fromDate: string;
  models: string[];
  tags: string[];
  toDate: string;
}

export class Filter {
  fromDate: string;
  models: string[];
  tags: string[];
  toDate: string;

  constructor(params: FilterParams) {
    this.fromDate = params.fromDate;
    this.models = params.models;
    this.tags = params.tags;
    this.toDate = params.toDate;
  }
}

interface DatasetParams {
  id: string;
  name: string;
  description: string;
  filters: FilterParams;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export class Dataset {
  datasetId: string;
  name: string;
  description: string;
  filters: Filter;
  userId: string;
  createdAt?: string;
  updatedAt?: string;

  constructor(params: DatasetParams) {
    this.datasetId = params.id;
    this.name = params.name;
    this.description = params.description;
    this.filters = new Filter(params.filters);
    this.userId = params.userId;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}
