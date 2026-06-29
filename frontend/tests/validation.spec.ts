import { test, expect } from '@playwright/test';
import {
  obligationFormSchema,
  readObligationForm,
} from '../app/lib/validation';

// Pure-logic specs — no browser, no backend.
test.use({ baseURL: undefined });

/** Minimal valid input; individual tests override one field at a time. */
function validInput() {
  return {
    type: 'annual_report' as const,
    title: 'File annual report',
    description: 'Some notes',
    dueDate: '2026-12-31',
    owner: 'Jane Doe',
    requiresDocument: true,
    companyTaxId: '12-3456789',
  };
}

test.describe('obligationFormSchema', () => {
  test('accepts a fully valid obligation', () => {
    expect(obligationFormSchema.safeParse(validInput()).success).toBe(true);
  });

  test('rejects an unknown type', () => {
    expect(
      obligationFormSchema.safeParse({ ...validInput(), type: 'not_a_type' })
        .success,
    ).toBe(false);
  });

  test('requires a non-empty title and trims it', () => {
    expect(
      obligationFormSchema.safeParse({ ...validInput(), title: '   ' }).success,
    ).toBe(false);

    const ok = obligationFormSchema.parse({ ...validInput(), title: '  Hi  ' });
    expect(ok.title).toBe('Hi');
  });

  test('requires an owner', () => {
    expect(
      obligationFormSchema.safeParse({ ...validInput(), owner: '' }).success,
    ).toBe(false);
  });

  test('defaults description to an empty string when omitted', () => {
    const { description: _omit, ...rest } = validInput();
    expect(obligationFormSchema.parse(rest).description).toBe('');
  });

  test('defaults requiresDocument to false when omitted', () => {
    const { requiresDocument: _omit, ...rest } = validInput();
    expect(obligationFormSchema.parse(rest).requiresDocument).toBe(false);
  });

  test.describe('dueDate', () => {
    test('rejects an empty value', () => {
      expect(
        obligationFormSchema.safeParse({ ...validInput(), dueDate: '' })
          .success,
      ).toBe(false);
    });

    test('rejects an unparseable date', () => {
      expect(
        obligationFormSchema.safeParse({ ...validInput(), dueDate: 'not-a-date' })
          .success,
      ).toBe(false);
    });

    test('accepts an ISO date', () => {
      expect(
        obligationFormSchema.safeParse({ ...validInput(), dueDate: '2026-01-01' })
          .success,
      ).toBe(true);
    });
  });

  test.describe('companyTaxId', () => {
    test('accepts the dashed format', () => {
      expect(
        obligationFormSchema.safeParse({
          ...validInput(),
          companyTaxId: '12-3456789',
        }).success,
      ).toBe(true);
    });

    test('accepts the dashless format', () => {
      expect(
        obligationFormSchema.safeParse({
          ...validInput(),
          companyTaxId: '123456789',
        }).success,
      ).toBe(true);
    });

    test('accepts an empty value (optional field)', () => {
      expect(
        obligationFormSchema.safeParse({ ...validInput(), companyTaxId: '' })
          .success,
      ).toBe(true);
    });

    test('defaults to empty when omitted', () => {
      const { companyTaxId: _omit, ...rest } = validInput();
      expect(obligationFormSchema.parse(rest).companyTaxId).toBe('');
    });

    test('rejects a malformed tax id', () => {
      for (const bad of ['1-3456789', '12-345678', 'ab-cdefghi', '123-456789']) {
        expect(
          obligationFormSchema.safeParse({ ...validInput(), companyTaxId: bad })
            .success,
        ).toBe(false);
      }
    });
  });
});

test.describe('readObligationForm', () => {
  function formData(entries: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [k, v] of Object.entries(entries)) fd.set(k, v);
    return fd;
  }

  test('reads every field out of FormData', () => {
    const fd = formData({
      type: 'franchise_tax',
      title: 'Pay franchise tax',
      description: 'desc',
      dueDate: '2026-05-01',
      owner: 'Sam',
      requiresDocument: 'on',
      companyTaxId: '12-3456789',
    });

    expect(readObligationForm(fd)).toEqual({
      type: 'franchise_tax',
      title: 'Pay franchise tax',
      description: 'desc',
      dueDate: '2026-05-01',
      owner: 'Sam',
      requiresDocument: true,
      companyTaxId: '12-3456789',
    });
  });

  test('treats a missing checkbox as requiresDocument: false', () => {
    expect(readObligationForm(formData({})).requiresDocument).toBe(false);
  });

  test('maps the checkbox to true only for the "on" value', () => {
    expect(
      readObligationForm(formData({ requiresDocument: 'true' })).requiresDocument,
    ).toBe(false);
    expect(
      readObligationForm(formData({ requiresDocument: 'on' })).requiresDocument,
    ).toBe(true);
  });

  test('falls back to defaults for missing fields', () => {
    const parsed = readObligationForm(formData({}));
    expect(parsed.type).toBe('annual_report');
    expect(parsed.title).toBe('');
    expect(parsed.description).toBe('');
    expect(parsed.dueDate).toBe('');
    expect(parsed.owner).toBe('');
    expect(parsed.companyTaxId).toBe('');
  });

  test('output of a filled form passes schema validation', () => {
    const fd = formData({
      type: 'boi_report',
      title: 'File BOI',
      dueDate: '2026-09-09',
      owner: 'Lee',
      requiresDocument: 'on',
    });
    expect(
      obligationFormSchema.safeParse(readObligationForm(fd)).success,
    ).toBe(true);
  });
});
