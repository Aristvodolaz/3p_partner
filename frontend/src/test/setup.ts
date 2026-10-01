import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// React Testing Library не чистит DOM между тестами при globals-режиме Vitest.
afterEach(() => cleanup());
