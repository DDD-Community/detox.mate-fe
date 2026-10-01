// Expo 55 provides URL, TextEncoder/TextDecoder and ReadableStream. React Native's
// fetch Response still omits body streams, which MSW needs for XMLHttpRequest.
const nativeGlobals = globalThis as typeof globalThis & {
  Event?: unknown;
  EventTarget?: unknown;
  MessageEvent?: unknown;
  ProgressEvent?: unknown;
  XMLHttpRequestUpload?: unknown;
};

// Conditional requires preserve the runtime's own implementations when present.
/* eslint-disable @typescript-eslint/no-require-imports */
nativeGlobals.Event ??= require('react-native/src/private/webapis/dom/events/Event').default;
nativeGlobals.EventTarget ??=
  require('react-native/src/private/webapis/dom/events/EventTarget').default;
nativeGlobals.MessageEvent ??=
  require('react-native/src/private/webapis/html/events/MessageEvent').default;
nativeGlobals.ProgressEvent ??=
  require('react-native/src/private/webapis/xhr/events/ProgressEvent').default;
/* eslint-enable @typescript-eslint/no-require-imports */
nativeGlobals.XMLHttpRequestUpload ??= new XMLHttpRequest().upload
  .constructor as typeof XMLHttpRequestUpload;

for (const BodyClass of [Request, Response]) {
  if ('body' in BodyClass.prototype) continue;
  const streams = new WeakMap<object, ReadableStream<Uint8Array> | null>();
  Object.defineProperty(BodyClass.prototype, 'body', {
    configurable: true,
    get(this: Request | Response) {
      if (!streams.has(this)) {
        const hasBody = (this as unknown as { _bodyInit?: unknown })._bodyInit != null;
        const body = this;
        streams.set(
          this,
          hasBody
            ? new ReadableStream<Uint8Array>(
                {
                  async pull(controller) {
                    try {
                      const bytes = new Uint8Array(await body.arrayBuffer());
                      controller.enqueue(bytes);
                      controller.close();
                    } catch (error) {
                      controller.error(error);
                    }
                  },
                },
                { highWaterMark: 0 }
              )
            : null
        );
      }
      return streams.get(this);
    },
  });
}
