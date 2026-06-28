import { test, expect } from '@playwright/test';
import {
  allowedTransitions,
  isOverdue,
  isDueSoon,
  isTransitionBlocked,
  transitionBlockedReason,
  maskTaxId,
} from '../app/lib/obligations-domain';
import type { Obligation } from '../app/lib/types';

// Pure-logic specs — no browser needed.
test.use({ baseURL: undefined });

const NOW = new Date('2026-06-25T00:00:00');

function ob(overrides: Partial<Obligation> = {}): Obligation {
  return {
    id: 'OB-1',
    type: 'annual_report',
    title: 'Test',
    description: '',
    status: 'in_progress',
    dueDate: '2026-07-10',
    owner: 'Dana',
    requiresDocument: false,
    hasDocument: false,
    companyTaxId: '12-3456789',
    history: [],
    ...overrides,
  };
}

test('allowedTransitions follows the state machine', () => {
  expect(allowedTransitions('pending')).toEqual(['in_progress']);
  expect(allowedTransitions('in_progress')).toEqual(['submitted', 'pending']);
  expect(allowedTransitions('submitted')).toEqual(['done', 'in_progress']);
  expect(allowedTransitions('done')).toEqual([]);
});

test('isOverdue: past due and active', () => {
  expect(isOverdue(ob({ dueDate: '2026-05-30', status: 'pending' }), NOW)).toBe(true);
  expect(isOverdue(ob({ dueDate: '2026-05-30', status: 'done' }), NOW)).toBe(false);
  expect(isOverdue(ob({ dueDate: '2026-07-10', status: 'pending' }), NOW)).toBe(false);
});

test('isDueSoon: active and within 21 days, not overdue', () => {
  expect(isDueSoon(ob({ dueDate: '2026-07-05', status: 'pending' }), NOW)).toBe(true);
  expect(isDueSoon(ob({ dueDate: '2026-09-01', status: 'pending' }), NOW)).toBe(false);
  expect(isDueSoon(ob({ dueDate: '2026-05-01', status: 'pending' }), NOW)).toBe(false);
});

test('submit blocked when a required document is missing', () => {
  const blocked = ob({ requiresDocument: true, hasDocument: false });
  expect(isTransitionBlocked(blocked, 'submitted')).toBe(true);
  expect(transitionBlockedReason(blocked, 'submitted')).toContain('document');

  const ok = ob({ requiresDocument: true, hasDocument: true });
  expect(isTransitionBlocked(ok, 'submitted')).toBe(false);
  expect(isTransitionBlocked(blocked, 'pending')).toBe(false);
});

test('maskTaxId reveals only the last four digits', () => {
  expect(maskTaxId('12-3456789')).toBe('••••6789');
  expect(maskTaxId('')).toBe('••••0000');
});
