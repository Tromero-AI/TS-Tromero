import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

export type ModelType = 'OpenAI' | 'Tromero';

const modelRegistry: Record<string, ModelType> = {};

export function registerModel(name: string, type: ModelType) {
  modelRegistry[name] = type;
}

export function getModelType(name: string): ModelType | undefined {
  return modelRegistry[name];
}

async function fetchAndRegisterOpenAIModels(client: OpenAI) {
  try {
    const data = await client.models.list();

    const models: string[] = data.data
      .map((model: { id: string }): string | null =>
        model.id.includes('gpt') && !model.id.includes('gpt-3.5-turbo-instruct')
          ? model.id
          : null
      )
      .filter((model: string | null): model is string => model !== null);

    models.forEach((model: string) => {
      registerModel(model, 'OpenAI');
    });
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
  }
}

export async function getModelTypeOrFetch(
  model: string,
  client: OpenAI
): Promise<ModelType> {
  const modelType = getModelType(model);
  if (modelType) {
    return modelType;
  }

  await fetchAndRegisterOpenAIModels(client);
  const newModelType = getModelType(model);
  if (newModelType) {
    return newModelType;
  }

  return 'Tromero';
}
