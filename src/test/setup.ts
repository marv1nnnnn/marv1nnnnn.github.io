import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom/extend-expect'; // Keep for type definitions

expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});