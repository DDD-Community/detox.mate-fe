import { useEffect, useState } from 'react';

export function useDebouncedUserCode(input: string) {
  const normalized = input.trim().toUpperCase();
  const ready = normalized.length >= 5;
  const [settled, setSettled] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSettled(ready ? normalized : ''), 350);
    return () => clearTimeout(timer);
  }, [normalized, ready]);
  return { userCode: ready && settled === normalized ? normalized : null, ready };
}
