interface ModelConfigParams {
  base_model: string;
  batch_size: string | number;
  custom_dataset: string | null;
  custom_logs_filename: string | null;
  epoch: string | number;
  learning_rate: string | number;
  number_of_bad_logs?: number;
  save_logs_with_tags: string | null;
  tags: string[] | null;
  externalServiceId?: string;
  podId?: string;
}

export class ModelConfig {
  base_model: string;
  batch_size: string | number;
  custom_dataset: string | null;
  custom_logs_filename: string | null;
  epoch: string | number;
  learning_rate: string | number;
  number_of_bad_logs?: number;
  save_logs_with_tags: string | null;
  tags: string[] | null;
  externalServiceId?: string;
  podId?: string;

  constructor(params: ModelConfigParams) {
    this.base_model = params.base_model;
    this.batch_size = params.batch_size;
    this.custom_dataset = params.custom_dataset;
    this.custom_logs_filename = params.custom_logs_filename;
    this.epoch = params.epoch;
    this.learning_rate = params.learning_rate;
    this.number_of_bad_logs = params.number_of_bad_logs;
    this.save_logs_with_tags = params.save_logs_with_tags;
    this.tags = params.tags;
    this.externalServiceId = params.externalServiceId;
    this.podId = params.podId;
  }
}

interface BaseModelDataParams {
  available_for_finetuning: boolean;
  available_for_inference: boolean;
  default_batch_size: number;
  default_lr: number;
  display_name: string;
  hf_repo: string;
  id: number | string;
  model_name: string;
  model_size: string;
  supported_context_len: number;
  training_time_per_log: number;
  training_time_y_intercept: number;
  supported_locations?: string[];
  [key: string]: any;
}

export class BaseModelData {
  availableForFinetuning: boolean;
  available_for_inference: boolean;
  default_batch_size: number;
  default_lr: number;
  display_name: string;
  hf_repo: string;
  id: number | string;
  model_name: string;
  model_size: string;
  supported_context_len: number;
  training_time_per_log: number;
  training_time_y_intercept: number;
  supported_locations?: string[];
  [key: string]: any;

  constructor(params: BaseModelDataParams) {
    this.availableForFinetuning = params.available_for_finetuning;
    this.available_for_inference = params.available_for_inference;
    this.default_batch_size = params.default_batch_size;
    this.default_lr = params.default_lr;
    this.display_name = params.display_name;
    this.hf_repo = params.hf_repo;
    this.id = params.id;
    this.model_name = params.model_name;
    this.model_size = params.model_size;
    this.supported_context_len = params.supported_context_len;
    this.training_time_per_log = params.training_time_per_log;
    this.training_time_y_intercept = params.training_time_y_intercept;
    this.supported_locations = params.supported_locations;
    // handle unknown properties
    const keys = Object.keys(params);
    keys.forEach((key) => {
      if (!(key in this)) {
        this[key] = params[key];
      }
    });
  }
}

interface MixEvalParams {
  global_status?: string;
  ongoing_tests?: string[];
  results?: MixEvalResults;
  status: MixEvalStatus;
}

interface MixEvalStatus {
  AGIEval?: string;
  ARC?: string;
  BBH?: string;
  BoolQ?: string;
  CommonsenseQA?: string;
  DROP?: string;
  GPQA?: string;
  GSM8k?: string;
  HellaSwag?: string;
  MATH?: string;
  MMLU?: string;
  OpenBookQA?: string;
  PIQA?: string;
  SIQA?: string;
  TriviaQA?: string;
  WinoGrande?: string;
  [key: string]: any;
}

interface MixEvalResults {
  AGIEval?: number;
  ARC?: number;
  BBH?: number;
  BoolQ?: number;
  CommonsenseQA?: number;
  DROP?: number;
  GPQA?: number;
  GSM8k?: number;
  HellaSwag?: number;
  MATH?: number;
  MMLU?: number;
  OpenBookQA?: number;
  PIQA?: number;
  SIQA?: number;
  TriviaQA?: number;
  WinoGrande?: number;
  'overall score (final score)'?: number;
}

interface needleHaystackParams {
  global_status?: string;
  results?: NeedleHaystackResults;
  status: NeedleHaystackStatus;
}

interface NeedleHaystackStatus {
  status: string;
}

interface NeedleHaystackResults {
  scores: number[][];
  x_axis: number[];
  y_axis: number[];
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

// interface EvaluationStateParams {
//   status: string;
// }

// class EvaluationState {
//   status: string;

//   constructor(params: EvaluationStateParams) {
//     this.status = params.status;
//   }
// }

interface ModelEvaluationStateParams {
  mixEval: MixEvalStatus;
  needleHaystack: NeedleHaystackStatus;
}

interface ModelEvaluationResultsParams {
  mixEval?: MixEvalResults;
  needleHaystack?: NeedleHaystackResults;
}

export class ModelEvaluationResults {
  mixEval?: MixEvalResults;
  needleHaystack?: NeedleHaystackResults;

  constructor(params: ModelEvaluationResultsParams) {
    this.mixEval = params.mixEval;
    this.needleHaystack = params.needleHaystack;
  }
}

export class ModelEvaluationState {
  mixEval: MixEvalStatus;
  needleHaystack: NeedleHaystackStatus;

  constructor(params: ModelEvaluationStateParams) {
    this.mixEval = params.mixEval;
    this.needleHaystack = params.needleHaystack;
  }
}

interface ModelParams {
  base_model_data: BaseModelData;
  base_model_id: number;
  created_at: string;
  created_at_unix: number;
  last_deployed_on: string | null;
  last_deployed_on_unix: number | null;
  last_used: string | null;
  last_used_unix: number | null;
  location?: string;
  model_config: ModelConfig;
  model_evaluation: ModelEvaluationResults;
  model_evaluation_state: ModelEvaluationState;
  model_id: number;
  model_name: string;
  self_hosted: boolean;
  server_id: number | null;
  state: string;
  training_ended_at: string | null;
  training_ended_at_unix: number | null;
  updated_at: string | null;
  usage_data: UsageData[];
  user_id: number;
  [key: string]: any;
}

export class Model {
  base_model_data: BaseModelData;
  base_model_id: number;
  created_at: string;
  created_at_unix: number;
  last_deployed_on: string | null;
  last_deployed_on_unix: number | null;
  last_used: string | null;
  last_used_unix: number | null;
  location?: string;
  model_config: ModelConfig;
  model_evaluation: ModelEvaluationResults;
  model_evaluation_state: ModelEvaluationState;
  model_id: number;
  model_name: string;
  self_hosted: boolean;
  server_id: number | null;
  state: string;
  training_ended_at: string | null;
  training_ended_at_unix: number | null;
  updated_at: string | null;
  usage_data: UsageData[];
  user_id: number;
  [key: string]: any;

  constructor(params: ModelParams) {
    this.base_model_data = params.base_model_data;
    this.base_model_id = params.base_model_id;
    this.created_at = params.created_at;
    this.created_at_unix = params.created_at_unix;
    this.last_deployed_on = params.last_deployed_on;
    this.last_deployed_on_unix = params.last_deployed_on_unix;
    this.last_used = params.last_used;
    this.last_used_unix = params.last_used_unix;
    this.location = params.location;
    this.model_config = params.model_config;
    this.model_evaluation = params.model_evaluation;
    this.model_evaluation_state = params.model_evaluation_state;
    this.model_id = params.model_id;
    this.model_name = params.model_name;
    this.self_hosted = params.self_hosted;
    this.server_id = params.server_id;
    this.state = params.state;
    this.training_ended_at = params.training_ended_at;
    this.training_ended_at_unix = params.training_ended_at_unix;
    this.updated_at = params.updated_at;
    this.usage_data = params.usage_data;
    this.user_id = params.user_id;
    const keys = Object.keys(params);
    keys.forEach((key) => {
      if (!(key in this)) {
        this[key] = params[key];
      }
    });
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
  from_date: number | null;
  models: string[] | null;
  tags: string[] | null;
  to_date: number | null;
}

export class Filter {
  from_date: number | null;
  models: string[] | null;
  tags: string[] | null;
  to_date: number | null;

  constructor(params: FilterParams) {
    this.from_date = params.from_date;
    this.models = params.models;
    this.tags = params.tags;
    this.to_date = params.to_date;
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
