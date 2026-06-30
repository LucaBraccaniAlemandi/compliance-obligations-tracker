import { test, expect } from '@playwright/test';
import {
  DEFAULT_LIMIT,
  encodeObligationParams,
  hasActiveFilters,
  parseObligationSearchParams,
} from '../app/lib/obligation-search-params';

// Pure-logic specs — no browser needed.
test.use({ baseURL: undefined });

test('parse applies defaults for empty params', () => {
  expect(parseObligationSearchParams({})).toEqual({
    limit: DEFAULT_LIMIT,
    offset: 0,
  });
});

test('parse normalizes a single status to an array and keeps valid ones', () => {
  expect(parseObligationSearchParams({ status: 'pending' }).status).toEqual([
    'pending',
  ]);
  expect(
    parseObligationSearchParams({ status: ['pending', 'bogus', 'done'] }).status,
  ).toEqual(['pending', 'done']);
  // No valid status => omitted entirely.
  expect(parseObligationSearchParams({ status: 'bogus' }).status).toBeUndefined();
});

test('parse maps overdue tri-state', () => {
  expect(parseObligationSearchParams({ overdue: 'true' }).overdue).toBe(true);
  expect(parseObligationSearchParams({ overdue: 'false' }).overdue).toBe(false);
  expect(parseObligationSearchParams({ overdue: 'yes' }).overdue).toBeUndefined();
});

test('parse trims title and clamps pagination', () => {
  expect(parseObligationSearchParams({ title: '  gdpr ' }).title).toBe('gdpr');
  expect(parseObligationSearchParams({ title: '   ' }).title).toBeUndefined();
  expect(parseObligationSearchParams({ limit: '500' }).limit).toBe(100);
  expect(parseObligationSearchParams({ limit: '0' }).limit).toBe(1);
  expect(parseObligationSearchParams({ offset: '-5' }).offset).toBe(0);
  expect(parseObligationSearchParams({ limit: 'x' }).limit).toBe(DEFAULT_LIMIT);
});

test('encode repeats status and omits unset filters', () => {
  const qs = encodeObligationParams({
    status: ['pending', 'in_progress'],
    overdue: true,
    title: 'gdpr',
    limit: 20,
    offset: 40,
  }).toString();
  expect(qs).toBe(
    'status=pending&status=in_progress&overdue=true&title=gdpr&limit=20&offset=40',
  );

  expect(encodeObligationParams({ limit: 20, offset: 0 }).toString()).toBe(
    'limit=20&offset=0',
  );
});

test('parse and encode round-trip', () => {
  const raw = { status: ['pending', 'done'], overdue: 'false', title: 'tax' };
  const parsed = parseObligationSearchParams(raw);
  const reparsed = parseObligationSearchParams(
    Object.fromEntries(
      // URLSearchParams collapses repeats; rebuild the status array manually.
      [['status', parsed.status ?? []]].concat(
        Object.entries({
          overdue: String(parsed.overdue),
          title: parsed.title ?? '',
        }),
      ),
    ),
  );
  expect(reparsed.status).toEqual(['pending', 'done']);
  expect(reparsed.overdue).toBe(false);
  expect(reparsed.title).toBe('tax');
});

test('parse reads sort_due_date, defaulting to asc (omitted)', () => {
  // Default: absent param => no sortDueDate (asc is the backend default).
  expect(parseObligationSearchParams({}).sortDueDate).toBeUndefined();
  expect(parseObligationSearchParams({ sort_due_date: 'asc' }).sortDueDate).toBeUndefined();
  // Only the non-default direction is carried.
  expect(parseObligationSearchParams({ sort_due_date: 'desc' }).sortDueDate).toBe('desc');
  // Invalid values are dropped (frontend never sends bad input).
  expect(parseObligationSearchParams({ sort_due_date: 'sideways' }).sortDueDate).toBeUndefined();
});

test('encode emits sort_due_date only for desc', () => {
  // Changed to desc => param present.
  expect(
    encodeObligationParams({ sortDueDate: 'desc', limit: 10, offset: 0 }).toString(),
  ).toBe('sort_due_date=desc&limit=10&offset=0');
  // Default asc / undefined => omitted for clean URLs.
  expect(
    encodeObligationParams({ sortDueDate: 'asc', limit: 10, offset: 0 }).toString(),
  ).toBe('limit=10&offset=0');
  expect(encodeObligationParams({ limit: 10, offset: 0 }).toString()).toBe(
    'limit=10&offset=0',
  );
});

test('hasActiveFilters ignores pagination', () => {
  expect(hasActiveFilters({ limit: 20, offset: 40 })).toBe(false);
  expect(hasActiveFilters({ status: ['pending'] })).toBe(true);
  expect(hasActiveFilters({ overdue: false })).toBe(true);
  expect(hasActiveFilters({ title: 'x' })).toBe(true);
});
