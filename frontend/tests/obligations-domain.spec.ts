import { test, expect } from '@playwright/test';
import {
  allowedTransitions,
  statusBadgeVariant,
} from '../app/lib/obligations-domain';

// Pure-logic specs — no browser needed.
test.use({ baseURL: undefined });

test('allowedTransitions follows the state machine', () => {
  expect(allowedTransitions('pending')).toEqual(['in_progress']);
  expect(allowedTransitions('in_progress')).toEqual(['submitted', 'pending']);
  expect(allowedTransitions('submitted')).toEqual(['done', 'in_progress']);
  expect(allowedTransitions('done')).toEqual([]);
});

test('statusBadgeVariant maps every status', () => {
  expect(statusBadgeVariant('pending')).toBe('secondary');
  expect(statusBadgeVariant('in_progress')).toBe('secondary');
  expect(statusBadgeVariant('submitted')).toBe('outline');
  expect(statusBadgeVariant('done')).toBe('default');
});
