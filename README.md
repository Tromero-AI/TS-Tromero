# Tromero API

## Installation

To install Tromero API, you can use npm:

```sh
npm install tromero
```

## Getting Started

Ensure you have set up both your OpenAI key and your Tromero key. You can follow the instructions on our site to create a Tromero API key.
[How to get a Tromero API key](https://docs.tromero.ai/python-package/openai-compatibility#prerequisites)

### Importing the Package

First, import the `Tromero` class from the `tromero` package:

```javascript
const Tromero = require('tromero');
```

or using ES6 imports:

```javascript
import Tromero from 'tromero';
```

### Initializing the Client

Initialize the `Tromero` client using your API keys, which should be stored securely and preferably as environment variables:

```javascript
const client = new TailorAI({
  apiKey: process.env.OPENAI_KEY, // optional if you are using OpenAI models
  tromeroKey: process.env.TROMERO_KEY, // optional if you are using Tromero models
});
```

### Usage

This class is a drop-in replacement for OpenAI, you should be able to use it as you did before. E.g:

```javascript
const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a friendly chatbot.' },
      { role: 'user', content: `${user prompt}` },
    ],
  });
```

And for your trained model:

```javascript
const completion = await client.chat.completions.create({
    model: 'chatbot-202408',
    messages: [
      { role: 'system', content: 'You are a friendly chatbot.' },
      { role: 'user', content: `${user prompt}` },
    ],
  });
```

#### JSON Formatting

Tromero supports JSON response formatting, allowing you to specify the expected structure of the response using a JSON schema. Formatting works for models you have trained on Tromero.

##### Specifying the Response Format in API Calls for OpenAI Models

When making API calls to OpenAI models where you expect the response to adhere to a specific format, you can specify the JSON schema using the `response_format` parameter. Here’s how you can pass this parameter in your API calls (you must explicitly mention you want a json response in your request):

```javascript
const response = await client.createCompletion({
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'user',
      content:
        'Please provide your name and age. Use json format in the response',
    },
  ],
  response_format: { type: 'json_object' },
});
```

#### Streaming

Tromero supports streaming responses, which allows you to receive and process data incrementally as it's generated.

##### Enabling Streaming

To enable streaming in your API calls, simply pass the parameter `stream: true` in your request. This tells the API to return the response incrementally, rather than waiting for the complete response to be ready.

Here's an example of how to initiate a streaming request:

```javascript
const completion = await client.chat.completions.create({
  model: 'chatbot-202408', // or an OpenAI model
  messages: [
    { role: 'system', content: 'You are a friendly chatbot.' },
    { role: 'user', content: input },
  ],
  stream: true,
});

/* if you are using express, you can stream the response to the client */
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');

for await (const chunk of completion) {
  res.write(`data: ${chunk.choices[0].delta.content}\n\n`);
}

res.end();

/* otherwise you can consume the stream in a loop */
for await (const chunk of completion) {
  console.log(chunk.choices[0].delta.content);
}
```

#### Fallback Models

Tromero supports the specification of fallback models to ensure robustness and continuity of service, even when your primary model might encounter issues. You can configure a fallback model, which can be any OpenAI model, to be used in case the primary model fails.

##### Configuring a Fallback Model

To set up a fallback model, you simply specify the `fallbackModel` parameter in your API calls. This parameter allows you to define an alternative model that the system should switch to in the event that the primary model fails to generate a response. The fallback model can be any other model that you have access to, whether self-hosted, hosted by Tromero, or available through OpenAI.

Here’s an example of how to specify a fallback model in your API calls:

```javascript
const completion = await client.chat.completions.create({
  model: 'chatbot-202408',
  messages: [
    { role: 'system', content: 'You are a friendly chatbot.' },
    { role: 'user', content: input },
  ],
  fallbackModel: 'gpt-4o-mini',
});
```

### Saving Data for Fine-Tuning

To save data for future fine-tuning with Tromero, you can enable the `saveData` parameter in your API calls. This allows you to collect and store the data generated during interactions with your models, which can be used to improve and refine your models over time.

```javascript
const completion = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'You are a friendly chatbot.' },
    { role: 'user', content: input },
  ],
  saveData: true,
});
```

#### Using Tags for Data Management

Tags help you sort and separate data when it comes to fine-tuning. By setting tags, you can easily manage and categorize the data collected during your interactions. You can pass tags in the create call as shown below:

```javascript
const completion = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'You are a friendly chatbot.' },
    { role: 'user', content: input },
  ],
  tags: ['version-1', 'feedback'],
  saveData: true,
  stream: true,
});
```

By utilizing tags, you can ensure that your data is organized effectively, making the fine-tuning process more efficient and streamlined.

### Using additional parameters

You can pass additional parameters to the API calls as needed. For example, you can specify the `temperature`, `max_tokens`, `top_p`, `frequency_penalty`, `presence_penalty`, and other parameters to fine-tune the response generation process.

```javascript
const completion = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'You are a friendly chatbot.' },
    { role: 'user', content: input },
  ],
  temperature: 0,
  max_tokens: 100,
});
```

### Error Handling

Tromero API calls can return errors, which you should handle appropriately in your code. Errors can occur due to various reasons, such as invalid API keys, model not found, or other issues.

Here’s an example of how you can handle errors in your code:

```javascript
try {
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a friendly chatbot.' },
      { role: 'user', content: input },
    ],
  });
} catch (error) {
  console.error('Error:', error.message);
}
```

### Full Example

Here’s a complete example of using the Tromero API in Node.js to generate a chatbot response:

```javascript
import Tromero from 'tromero';

const client = new Tromero({
  apiKey: process.env.OPENAI_KEY,
  tromeroKey: process.env.TROMERO_KEY,
});

const input = 'How are you doing today?';

const completion = await client.chat.completions.create({
  model: 'chatbot-202408', // or an OpenAI model
  messages: [
    { role: 'system', content: 'You are a friendly chatbot.' },
    { role: 'user', content: input },
  ],
  temperature: 0,
  max_tokens: 100,
  top_p: 1,
  frequency_penalty: 0,
  stream: true,

  // Tromero specific parameters
  saveData: true,
  tags: ['version-1', 'feedback'],
  fallbackModel: 'gpt-4o-mini',
});
```

### Summary

In this guide, we covered the key functionalities of the Tromero package in Node.js, including JSON formatting, streaming, fallback models, data saving, and tagging. By following these instructions, you can effectively utilize the Tromero API to build powerful AI applications and services.

This package is fully typed and supports TypeScript out of the box.
