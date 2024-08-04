import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

async function fetchAndRegisterOpenAIModels(apiKey: string) {
  const client = new OpenAI({ apiKey });
  try {
    const list = await client.models.list();

    // const models = data.data.map((model: { id: string }) => model.id);
    // const config = { openaiModels: models };

    // const configPath = path.resolve(__dirname, '../config/models.json');
    // fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    // console.log('OpenAI models updated successfully.');
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
  }
}

const openAIKey = process.env.OPENAI_API_KEY;
if (openAIKey) {
  fetchAndRegisterOpenAIModels(openAIKey);
} else {
  console.error('OpenAI API key is not set.');
}
