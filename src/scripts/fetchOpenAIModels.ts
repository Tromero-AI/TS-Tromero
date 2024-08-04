import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { registerModel } from '../models';
import readline from 'readline';

dotenv.config();

export async function fetchAndRegisterOpenAIModels(apiKey: string) {
  const client = new OpenAI({ apiKey });
  try {
    const data = await client.models.list();

    const models: string[] = data.data
      .map((model: { id: string }): string | null =>
        model.id.includes('gpt') && !model.id.includes('gpt-3.5-turbo-instruct')
          ? model.id
          : null
      )
      .filter((model: string | null): model is string => model !== null)
      .sort((a, b) => b.localeCompare(a));
    const config = { openaiModels: models };

    const configPath = path.resolve(__dirname, '../config/models.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Generate TypeScript file with union type
    const modelsTsContent = `export type OpenAIModels = ${models
      .map((model) => `'${model}'`)
      .join(' | ')};`;
    const modelsTsPath = path.resolve(__dirname, '../types/models.ts');
    fs.writeFileSync(modelsTsPath, modelsTsContent);

    models.forEach((model: string) => {
      registerModel(model, 'OpenAI');
    });
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
  }
}

const openAIKey = process.env.OPENAI_API_KEY;
console.log('openAIKey', openAIKey);
if (openAIKey) {
  fetchAndRegisterOpenAIModels(openAIKey);
} else {
  console.error(
    'We are trying to fetch the latest OpenAI models for your convenience, but the API key is not set. you can set it from the terminal or provide a .env file. We will not keep your API key after executing this call'
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter your OpenAI API key: ', (apiKey: string) => {
    fetchAndRegisterOpenAIModels(apiKey);
    rl.close();
  });
}
