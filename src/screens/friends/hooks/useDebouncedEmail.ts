import { useEffect, useState } from 'react';

export function useDebouncedEmail(input: string) {
  const email = input.trim().toLowerCase();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const [settled, setSettled] = useState('');
  useEffect(() => {
    // Wait across a typical burst of typing; input changes hide the old result immediately.
    const timer = setTimeout(() => setSettled(valid ? email : ''), 350);
    return () => clearTimeout(timer);
  }, [email, valid]);
  return { email: valid && settled === email ? email : null, valid };
}
