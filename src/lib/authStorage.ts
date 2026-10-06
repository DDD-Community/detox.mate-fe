// Native storage operations already in flight cannot be undone by a session check.
// Serialize authentication transactions so a later login always persists last.
let previous: Promise<unknown> = Promise.resolve();

export function withAuthStorage<T>(operation: () => Promise<T>): Promise<T> {
  const result = previous.then(operation, operation);
  previous = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}
