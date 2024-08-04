import fs from 'fs';
import path from 'path';
import { fetchAndRegisterOpenAIModels } from './scripts/fetchOpenAIModels';

export type ModelType = 'OpenAI' | 'Tromero' | 'BaseModel';

interface ModelRegistration {
  type: ModelType;
  name: string;
}

const modelRegistry: Record<string, ModelType> = {};

export function registerModel(name: string, type: ModelType) {
  modelRegistry[name] = type;
}

export function getModelType(name: string): ModelType | undefined {
  return modelRegistry[name];
}

export async function initializeModelRegistry() {
  try {
    const configPath = path.resolve(__dirname, 'config/models.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config.openaiModels.forEach((model: string) => {
        registerModel(model, 'OpenAI');
      });
    } else {
      console.error(
        'No cached models found. Ensure OpenAI models are fetched.'
      );
    }
  } catch (error) {
    console.error('Error initializing model registry:', error);
  }
}

export async function getModelTypeOrFetch(
  model: string,
  apiKey: string
): Promise<ModelType> {
  const modelType = getModelType(model);
  if (modelType) {
    return modelType;
  }

  if (apiKey) {
    await fetchAndRegisterOpenAIModels(apiKey);
    const newModelType = getModelType(model);
    if (newModelType) {
      return newModelType;
    }
  } else {
    console.error('OpenAI API key is not set.');
  }

  return 'Tromero';
}
