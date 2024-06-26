import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Readable } from 'stream';
import {
  getModelUrl,
  postData,
  tromeroModelCreate,
  tromeroModelCreateStream,
} from '../src/tromeroRequests';
import {
  mockOpenAIFormatStream,
  StreamResponseObject,
} from '../src/tromeroUtils';

const mock = new MockAdapter(axios);

describe('API Tests', () => {
  afterEach(() => {
    mock.reset();
  });

  it('should post data successfully', async () => {
    const data = { key: 'value' };
    const authToken = 'test-token';
    const mockResponse = { status_code: 200, data: 'success' };

    mock
      .onPost('https://midyear-grid-402910.lm.r.appspot.com/tailor/v1/data')
      .reply(200, mockResponse);

    const response = await postData(data, authToken);
    expect(response).toEqual(mockResponse);
  });

  it('should handle post data error', async () => {
    const data = { key: 'value' };
    const authToken = 'test-token';

    mock
      .onPost('https://midyear-grid-402910.lm.r.appspot.com/tailor/v1/data')
      .reply(500, { message: 'Internal Server Error' });

    const response = await postData(data, authToken);
    expect(response.error).toBe(
      'An error occurred: Request failed with status code 500'
    );
    expect(response.status_code).toBe(500);
  });

  it('should create tromero model successfully', async () => {
    const model = 'test-model';
    const modelUrl = 'https://example.com';
    const messages = [{ message: 'Hello' }];
    const tromeroKey = 'test-key';
    const mockResponse = { status_code: 200, data: 'model created' };

    mock.onPost(`${modelUrl}/generate`).reply(200, mockResponse);

    const response = await tromeroModelCreate(
      model,
      modelUrl,
      messages,
      tromeroKey
    );
    expect(response).toEqual(mockResponse);
  });

  it('should handle tromero model creation error', async () => {
    const model = 'test-model';
    const modelUrl = 'https://example.com';
    const messages = [{ message: 'Hello' }];
    const tromeroKey = 'test-key';

    mock
      .onPost(`${modelUrl}/generate`)
      .reply(500, { message: 'Internal Server Error' });

    const response = await tromeroModelCreate(
      model,
      modelUrl,
      messages,
      tromeroKey
    );
    expect(response.error).toBe(
      'An error occurred: Request failed with status code 500'
    );
    expect(response.status_code).toBe(500);
  });

  it('should handle tromero model create stream successfully', async () => {
    const modelUrl = 'https://example.com';
    const messages = [{ message: 'Hello' }];
    const tromeroKey = 'test-key';

    // Mock the streaming response
    const streamData = JSON.stringify({ message: 'Hello from stream' });
    const stream = new Readable({
      read() {
        this.push(streamData);
        this.push(null); // No more data
      },
    });

    mock.onPost(`${modelUrl}/generate`).reply(() => [200, stream]);

    const onData = jest.fn();
    const onError = jest.fn();
    const onEnd = jest.fn();

    await tromeroModelCreateStream(modelUrl, messages, tromeroKey, {
      onData,
      onError,
      onEnd,
    });

    expect(onData).toHaveBeenCalledWith(JSON.parse(streamData));
    expect(onError).not.toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalled();
  });

  it('should handle tromero model create stream error', async () => {
    const modelUrl = 'https://example.com';
    const messages = [{ message: 'Hello' }];
    const tromeroKey = 'test-key';

    // Mock the streaming error
    const stream = new Readable({
      read() {
        this.emit('error', new Error('Stream error'));
      },
    });

    mock.onPost(`${modelUrl}/generate`).reply(() => [500, stream]);

    const onData = jest.fn();
    const onError = jest.fn();
    const onEnd = jest.fn();

    await tromeroModelCreateStream(modelUrl, messages, tromeroKey, {
      onData,
      onError,
      onEnd,
    });

    expect(onData).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(new Error('Stream error'));
    expect(onEnd).toHaveBeenCalled();
  });
});
