var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __reflectGet = Reflect.get;
var __knownSymbol = (name, symbol) => {
  return (symbol = Symbol[name]) ? symbol : Symbol.for("Symbol." + name);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __superGet = (cls, obj, key) => __reflectGet(__getProtoOf(cls), key, obj);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var __await = function(promise, isYieldStar) {
  this[0] = promise;
  this[1] = isYieldStar;
};
var __asyncGenerator = (__this, __arguments, generator) => {
  var resume = (k, v, yes, no) => {
    try {
      var x = generator[k](v), isAwait = (v = x.value) instanceof __await, done = x.done;
      Promise.resolve(isAwait ? v[0] : v).then((y) => isAwait ? resume(k === "return" ? k : "next", v[1] ? { done: y.done, value: y.value } : y, yes, no) : yes({ value: y, done })).catch((e) => resume("throw", e, yes, no));
    } catch (e) {
      no(e);
    }
  };
  var method = (k) => it[k] = (x) => new Promise((yes, no) => resume(k, x, yes, no));
  var it = {};
  return generator = generator.apply(__this, __arguments), it[__knownSymbol("asyncIterator")] = () => it, method("next"), method("throw"), method("return"), it;
};

// src/Tromero.ts
import * as openai from "openai";

// src/openai/streaming.ts
import { Stream } from "openai/streaming";

// src/openai/mergeChunks.ts
function mergeChunks(base, chunk) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  if (base === null) {
    return mergeChunks(
      __spreadProps(__spreadValues({}, chunk), { object: "chat.completion", choices: [] }),
      chunk
    );
  }
  const choices = [...base.choices];
  for (const choice of chunk.choices) {
    const baseChoice = choices.find((c) => c.index === choice.index);
    if (baseChoice) {
      baseChoice.finish_reason = (_a = choice.finish_reason) != null ? _a : baseChoice.finish_reason;
      baseChoice.message = (_b = baseChoice.message) != null ? _b : { role: "assistant" };
      if ((_c = choice.delta) == null ? void 0 : _c.content) {
        baseChoice.message.content = ((_d = baseChoice.message.content) != null ? _d : "") + ((_e = choice.delta.content) != null ? _e : "");
      }
      if ((_f = choice.delta) == null ? void 0 : _f.tool_calls) {
        baseChoice.message.tool_calls = (_g = baseChoice.message.tool_calls) != null ? _g : [];
        baseChoice.message.tool_calls.push(
          ...choice.delta.tool_calls.map(
            (tc) => {
              var _a2;
              return __spreadProps(__spreadValues({}, tc), {
                id: (_a2 = tc.id) != null ? _a2 : ""
              });
            }
          )
        );
      }
    } else {
      choices.push({
        index: choice.index,
        finish_reason: (_h = choice.finish_reason) != null ? _h : "stop",
        logprobs: (_i = choice.logprobs) != null ? _i : null,
        message: __spreadValues({
          role: "assistant"
        }, choice.delta)
      });
    }
  }
  const merged = __spreadProps(__spreadValues({}, base), {
    choices
  });
  return merged;
}

// src/openai/streaming.ts
var MockStream = class _MockStream extends Stream {
  constructor(stream, saveData) {
    super(stream.iterator, stream.controller);
    this.saveData = saveData;
  }
  [Symbol.asyncIterator]() {
    return __asyncGenerator(this, null, function* () {
      const iterator = __superGet(_MockStream.prototype, this, Symbol.asyncIterator).call(this);
      let combinedResponse = null;
      while (true) {
        const result = yield new __await(iterator.next());
        if (result.done)
          break;
        combinedResponse = mergeChunks(combinedResponse, result.value);
        yield result.value;
      }
      yield new __await(this.saveData(combinedResponse));
    });
  }
};

// src/Tromero_Client.ts
var TromeroClient = class {
  constructor({
    apiKey,
    baseURL = "https://midyear-grid-402910.lm.r.appspot.com/tailor/v1",
    dataURL = `${baseURL}/data`
  }) {
    this.apiKey = apiKey;
    this.dataURL = dataURL;
    this.baseURL = baseURL;
    this.modelUrls = {};
    this.baseModel = {};
  }
  fetchData(url, options) {
    return __async(this, null, function* () {
      try {
        const response = yield fetch(url, options);
        const data = yield response.json();
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return data;
      } catch (error) {
        if (error instanceof Error) {
          return {
            error: `An error occurred: ${error.message}`,
            status_code: "N/A"
          };
        }
        return {
          error: "An error occurred",
          status_code: "N/A"
        };
      }
    });
  }
  postData(data) {
    return __async(this, null, function* () {
      return this.fetchData(this.dataURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": this.apiKey
        },
        body: JSON.stringify(data)
      });
    });
  }
  getModelUrl(modelName) {
    return __async(this, null, function* () {
      return this.fetchData(`${this.baseURL}/model/${modelName}/url`, {
        method: "GET",
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json"
        }
      });
    });
  }
  mockOpenAIFormatStream(messages) {
    const choice = { delta: { content: messages } };
    return { choices: [choice] };
  }
  streamResponse(response) {
    return __asyncGenerator(this, null, function* () {
      var _a;
      const reader = (_a = response.body) == null ? void 0 : _a.getReader();
      const decoder = new TextDecoder("utf-8");
      let lastChunk = "";
      if (reader) {
        while (true) {
          const { done, value } = yield new __await(reader.read());
          if (done)
            break;
          const chunkStr = decoder.decode(value);
          lastChunk = chunkStr;
          const pattern = /"token":({.*?})/;
          const match = pattern.exec(chunkStr);
          if (match) {
            const json = JSON.parse(match[1]);
            const formattedChunk = this.mockOpenAIFormatStream(json["text"]);
            yield formattedChunk;
          } else {
            break;
          }
        }
      }
    });
  }
  create(_0, _1, _2) {
    return __async(this, arguments, function* (model, modelUrl, messages, parameters = {}) {
      return this.fetchData(`${modelUrl}/generate`, {
        method: "POST",
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ adapter_name: model, messages, parameters })
      });
    });
  }
  // async createStream(
  //   model: string,
  //   modelUrl: string,
  //   messages: any[],
  //   parameters: { [key: string]: any },
  //   onData: (data: any) => void,
  //   onError: (error: Error) => void,
  //   onEnd: () => void
  // ) {
  //   try {
  //     const response = await fetch(`${modelUrl}/generate`, {
  //       method: 'POST',
  //       headers: {
  //         'X-API-KEY': this.apiKey,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ messages, parameters, adapter_name: model }),
  //     });
  //     const reader = response.body?.getReader();
  //     const decoder = new TextDecoder('utf-8');
  //     if (reader) {
  //       reader
  //         .read()
  //         .then(function process({ done, value }) {
  //           if (done) {
  //             onEnd();
  //             return;
  //           }
  //           const chunk = decoder.decode(value, { stream: true });
  //           onData(JSON.parse(chunk));
  //           reader.read().then(process).catch(onError);
  //         })
  //         .catch(onError);
  //     }
  //   } catch (error) {
  //     onError(error as Error);
  //   }
  // }
  // async createStream(
  //   model: string,
  //   modelUrl: string,
  //   messages: any[],
  //   parameters: { [key: string]: any },
  //   onData: (data: ChatCompletionChunk) => void,
  //   onError: (error: Error) => void,
  //   onEnd: () => void
  // ) {
  //   try {
  //     const response = await fetch(`${modelUrl}/generate_stream`, {
  //       method: 'POST',
  //       headers: {
  //         'X-API-KEY': this.apiKey,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ messages, parameters, adapter_name: model }),
  //     });
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }
  //     const reader = response.body?.getReader();
  //     const decoder = new TextDecoder('utf-8');
  //     if (reader) {
  //       let buffer = '';
  //       const process = async ({
  //         done,
  //         value,
  //       }: ReadableStreamDefaultReadResult<Uint8Array>) => {
  //         if (done) {
  //           onEnd();
  //           return;
  //         }
  //         buffer += decoder.decode(value, { stream: true });
  //         const parts = buffer.split('\n');
  //         buffer = parts.pop()!; // Keep the last incomplete part in the buffer
  //         for (const part of parts) {
  //           if (part.startsWith('data:')) {
  //             try {
  //               const jsonStr = part.substring(5);
  //               const data = JSON.parse(jsonStr);
  //               if (data.token && data.token.text) {
  //                 const formattedChunk: ChatCompletionChunk = {
  //                   choices: [
  //                     {
  //                       finish_reason: null,
  //                       index: 0,
  //                       delta: {
  //                         content: data.token.text,
  //                       },
  //                     },
  //                   ],
  //                   id: '',
  //                   created: 0,
  //                   model: '',
  //                   object: 'chat.completion.chunk',
  //                 };
  //                 onData(formattedChunk);
  //               }
  //             } catch (error) {
  //               console.error('Error parsing JSON data:', error);
  //             }
  //           }
  //         }
  //         reader.read().then(process).catch(onError);
  //       };
  //       reader.read().then(process).catch(onError);
  //     } else {
  //       onEnd();
  //     }
  //   } catch (error) {
  //     onError(error as Error);
  //   }
  // }
};

// src/Tromero.ts
var Tromero = class extends openai.OpenAI {
  constructor(_a) {
    var _b = _a, { tromeroKey, apiKey } = _b, opts = __objRest(_b, ["tromeroKey", "apiKey"]);
    super(__spreadValues({ apiKey }, opts));
    this.chat = new MockChat(this);
    if (tromeroKey) {
      const tromeroClient = new TromeroClient({ apiKey: tromeroKey });
      this.chat.setClient(tromeroClient);
    } else {
      if (apiKey) {
        console.warn(
          "You're using the Tromero client without an API key. While OpenAI requests will still go through, Tromero requests will fail, and no data will be saved."
        );
      } else {
        console.warn(
          "You haven't set an apiKey for OpenAI or a tromeroKey for Tromero. Please set one of these to use the client."
        );
      }
    }
  }
};
var MockChat = class extends openai.OpenAI.Chat {
  constructor(client) {
    super(client);
    this.completions = new MockCompletions(client);
  }
  setClient(client) {
    this.completions.setTromeroClient(client);
  }
};
var MockCompletions = class extends openai.OpenAI.Chat.Completions {
  constructor(client) {
    super(client);
    this.openaiClient = client;
  }
  setTromeroClient(client) {
    this.tromeroClient = client;
  }
  choiceToDict(choice) {
    return {
      message: {
        content: choice.message.content,
        role: choice.message.role
      }
    };
  }
  saveDataOnServer(saveData, data) {
    return __async(this, null, function* () {
      try {
        if (saveData && this.tromeroClient) {
          setTimeout(() => this.tromeroClient.postData(data), 0);
        }
      } catch (error) {
      }
      return "";
    });
  }
  formatKwargs(kwargs) {
    return __async(this, null, function* () {
      const keysToKeep = [
        "best_of",
        "decoder_input_details",
        "details",
        "do_sample",
        "max_tokens",
        "ignore_eos_token",
        "repetition_penalty",
        "return_full_outcome",
        "seed",
        "stop",
        "temperature",
        "top_k",
        "top_p",
        "truncate",
        "typical_p",
        "watermark",
        "schema",
        "adapter_id",
        "adapter_source",
        "merged_adapters",
        "response_format"
      ];
      const additionalKeys = [
        "tags",
        "model",
        "messages",
        "use_fallback",
        "fallback_model",
        "stream"
      ];
      const validKeys = /* @__PURE__ */ new Set([...keysToKeep, ...additionalKeys]);
      const formattedKwargs = {};
      const openAiKwargs = {};
      let invalidKeyFound = false;
      for (const key in kwargs) {
        if (validKeys.has(key)) {
          formattedKwargs[key] = kwargs[key];
        } else {
          console.warn(
            `Warning: ${key} is not a valid parameter for the model. This parameter will be ignored.`
          );
          invalidKeyFound = true;
        }
        if (keysToKeep.includes(key)) {
          openAiKwargs[key] = kwargs[key];
        }
      }
      if (invalidKeyFound) {
        console.log(
          "The following parameters are valid for the model: ",
          keysToKeep.join(", ")
        );
      }
      return { formattedKwargs, openAiKwargs };
    });
  }
  formatMessages(messages) {
    let systemPrompt = "";
    let numPrompts = 0;
    for (const message of messages) {
      if (message.role === "system") {
        systemPrompt += message.content + " ";
        numPrompts += 1;
      } else {
        break;
      }
    }
    if (numPrompts <= 1) {
      return messages;
    }
    const combinedMessage = {
      role: "system",
      content: systemPrompt.trim()
    };
    const remainingMessages = messages.slice(numPrompts);
    console.warn(
      "Warning: Multiple system prompts will be combined into one prompt when saving data or calling custom models."
    );
    return [combinedMessage, ...remainingMessages];
  }
  isModelFromOpenAi(model) {
    return __async(this, null, function* () {
      try {
        const models = yield this._client.models.list();
        const modelNames = models.data.map((m) => m.id);
        return modelNames.includes(model);
      } catch (error) {
        console.warn("Error in retrieving OpenAi's model list");
        return false;
      }
    });
  }
  _create(body, options) {
    let resp;
    resp = body.stream ? super.create(body, options) : super.create(body, options);
    return resp;
  }
  create(_a, options) {
    return __async(this, null, function* () {
      var _b = _a, {
        saveData,
        tags
      } = _b, body = __objRest(_b, [
        "saveData",
        "tags"
      ]);
      var _b2, _c;
      const _a2 = body, {
        model,
        use_fallback = true,
        fallback_model = ""
      } = _a2, kwargs = __objRest(_a2, [
        "model",
        "use_fallback",
        "fallback_model"
      ]);
      const messages = this.formatMessages(kwargs.messages);
      const { formattedKwargs, openAiKwargs } = yield this.formatKwargs(kwargs);
      let isOpenAiModel = yield this.isModelFromOpenAi(model);
      let res;
      if (isOpenAiModel) {
        try {
          if (body.stream) {
            res = yield this._create(body, options);
            try {
              return new MockStream(res, (response) => {
                const dataToSend = {
                  messages: [...messages, response.choices[0].message],
                  model,
                  kwargs: openAiKwargs,
                  creation_time: (/* @__PURE__ */ new Date()).toISOString(),
                  tags: Array.isArray(tags) ? tags.join(", ") : typeof tags === "string" ? tags : ""
                };
                console.log("dataToSend: ", dataToSend);
                if (!saveData)
                  return Promise.resolve("");
                return this.saveDataOnServer(saveData, {
                  messages: [...messages, response.choices[0].message],
                  model,
                  openAiKwargs,
                  creation_time: (/* @__PURE__ */ new Date()).toISOString(),
                  tags: Array.isArray(tags) ? tags.join(", ") : typeof tags === "string" ? tags : ""
                });
              });
            } catch (e) {
              console.error("Tromero: error creating Mock stream");
              console.error(e);
              throw e;
            }
          } else {
            res = yield this._create(body, options);
            if (res.choices) {
              for (const choice of res.choices) {
                const formattedChoice = this.choiceToDict(choice);
                const dataToSend = {
                  messages: messages.concat([formattedChoice.message]),
                  model,
                  kwargs: openAiKwargs,
                  creation_time: (/* @__PURE__ */ new Date()).toISOString(),
                  tags: Array.isArray(tags) ? tags.join(", ") : typeof tags === "string" ? tags : ""
                };
                console.log("dataToSend: ", dataToSend);
                if (saveData) {
                  this.saveDataOnServer(saveData, {
                    messages: messages.concat([formattedChoice.message]),
                    model,
                    kwargs: openAiKwargs,
                    creation_time: (/* @__PURE__ */ new Date()).toISOString(),
                    tags: Array.isArray(tags) ? tags.join(", ") : typeof tags === "string" ? tags : ""
                  });
                }
              }
            }
            return res;
          }
        } catch (error) {
          if (error instanceof openai.APIError) {
            const rawMessage = error.message;
            const message = Array.isArray(rawMessage) ? rawMessage.join(", ") : rawMessage;
            console.warn("Error in create: ", message);
            throw error;
          }
        }
      } else {
        if (this.tromeroClient && !(model in this.tromeroClient.modelUrls)) {
          const { url, baseModel } = yield this.tromeroClient.getModelUrl(model);
          this.tromeroClient.modelUrls[model] = url;
          this.tromeroClient.baseModel[model] = baseModel;
        }
        console.log("model url", (_b2 = this.tromeroClient) == null ? void 0 : _b2.modelUrls[model]);
        console.log("model base", (_c = this.tromeroClient) == null ? void 0 : _c.baseModel[model]);
      }
    });
  }
};

// src/index.ts
var src_default = Tromero;
export {
  src_default as default
};
//# sourceMappingURL=index.mjs.map