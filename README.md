# Tromero

## Overview

This package is a Node.js client library for the [Tromero API](https://docs.tromero.ai/). It provides a convenient way to interact with the API and build AI-powered applications using JavaScript or TypeScript. For more information about tromero, please visit our [website](https://www.tromero.ai/).

## Installation

To install the package, you can use npm:

```sh
npm install tromero
```

## Getting Started

Ensure you have set up both your OpenAI key and your Tromero key. You can follow the instructions on our site to create a Tromero API key.
[How to get a Tromero API key](https://docs.tromero.ai/package/openai-compatibility#prerequisites). In order to get a tromero key, you need to have an account on Tromero.

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

Initialize the `Tromero` client using your API key, which should be stored securely and preferably as an environment variable:

```javascript
const client = new Tromero({
  tromeroKey: process.env.TROMERO_KEY,
});
```

If you have a preference for the location of the models you want to use, you can specify it in the client initialization using the `locationPreference` parameter.

```javascript
const client = new Tromero({
  tromeroKey: process.env.TROMERO_KEY,
  locationPreference: 'uk',
});
```

There are different models available in different regions, so by selecting a region you may be limiting the choice of base models. The client parameter for location takes priority over the settings on the Tromero platform.

If you would like to use OpenAI models, you can also provide your OpenAI API key:

```javascript
const client = new Tromero({
  apiKey: process.env.OPENAI_KEY,
  tromeroKey: process.env.TROMERO_KEY,
});
```

### Usage

This class is a drop-in replacement for OpenAI, you should be able to use it as you did before. E.g:

```javascript
const completion = await client.chat.completions.create({
  model: 'gpt-4o-mini', // an OpenAI model
  messages: [
    { role: 'system', content: 'You are a friendly chatbot.' },
    { role: 'user', content: `${userPrompt}` },
  ],
});
```

And for your trained models:

```javascript
const completion = await client.chat.completions.create({
  model: 'chatbot-202408', // your model hosted on Tromero.
  messages: [
    { role: 'system', content: 'You are a friendly chatbot.' },
    { role: 'user', content: `${userPrompt}` },
  ],
});
```

Even for base models:

```javascript
const completion = await client.chat.completions.create({
  model: 'llama-3.1-70b-instruct', // any base model hosted on Tromero.
  messages: [
    { role: 'system', content: 'You are a friendly chatbot.' },
    { role: 'user', content: `${userPrompt}` },
  ],
});
```

For a full list of supported base models, please visit our [website](https://www.tromero.ai/models).

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

/* if you are using express server, you can stream the response to the client */
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

Tromero supports the specification of fallback models to ensure robustness and continuity of service, even when your primary model might encounter issues. You can configure a fallback model to be used in case the primary model fails.

##### Configuring a Fallback Model

To set up a fallback model, you simply specify the `fallbackModel` parameter in your API calls. This parameter allows you to define an alternative model that the system should switch to in the event that the primary model fails to generate a response. The fallback model can be any other model that you have access to, whether self-hosted (linked to Tromero), hosted by Tromero, or available through OpenAI.

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

To save data for future fine-tuning with Tromero, you can enable the `saveDataDefault` optional parameter when you initiate the client. This allows you to collect and store the data generated during every interaction with our system, which can be used to improve and refine your models over time.

```javascript
const client = new Tromero({
  apiKey: process.env.OPENAI_KEY,
  tromeroKey: process.env.TROMERO_KEY,
  saveDataDefault: true,
});
```

Alternatively, you can enable the `saveData` parameter in your API calls. This allows you to collect and store the data generated during specific interactions, rather than for all interactions. Setting `saveData` overrides the default behavior set in the client.

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
  tromeroKey: process.env.TROMERO_KEY,
  apiKey: process.env.OPENAI_KEY, // to use OpenAI model as fallback
  saveDataDefault: true,
  locationPreference: 'uk',
});

const input = 'How are you doing today?';

const completion = await client.chat.completions.create({
  model: 'chatbot-202408',
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
  tags: ['version-1', 'feedback'],
  fallbackModel: 'gpt-4o-mini',
});
```

### Summary

In this guide, we covered the key functionalities of the Tromero package in Node.js, including JSON formatting, streaming, fallback models, data saving, and tagging. By following these instructions, you can effectively utilize the Tromero API to build powerful AI applications and services.

This package is fully typed and supports TypeScript out of the box.

If you find any issues or have any questions, please feel free to reach out by creating an issue on our GitHub repository.
