import { AxiosError, AxiosHeaders } from 'axios';
import { loadTypeScriptModules } from './load-typescript.mjs';

/** Exercise the real Axios transforms/interceptors without opening network connections. */
export function mockAdapter(handler) {
  return async (config) => {
    const result = await handler('/api' + config.url, {
      method: config.method.toUpperCase(),
      body: config.data,
      headers: config.headers.toJSON(),
      withCredentials: config.withCredentials,
      config,
    });
    const response = {
      config,
      status: result.status,
      statusText: result.statusText,
      headers: AxiosHeaders.from(Object.fromEntries(result.headers)),
      data: await result.text(),
    };
    if (config.validateStatus && !config.validateStatus(response.status))
      throw new AxiosError(
        'HTTP ' + response.status,
        AxiosError.ERR_BAD_RESPONSE,
        config,
        undefined,
        response,
      );
    return response;
  };
}
export async function mockClient(entry, handler = (...args) => globalThis.fetch(...args)) {
  const [client, transport] = await loadTypeScriptModules([
    entry,
    new URL('../../src/lib/axios.ts', import.meta.url),
  ]);
  transport.axios.defaults.adapter = mockAdapter(handler);
  return { ...client, axios: transport.axios };
}
