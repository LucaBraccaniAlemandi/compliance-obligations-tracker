import Link from 'next/link';
import { getObligationOrNotFound } from '@/app/lib/obligations';
import { updateObligation } from '@/app/lib/actions';
import { getDictionary } from '@/app/lib/dictionaries/get';
import type { Locale } from '@/app/lib/dictionaries/config';
import { ObligationForm } from '../../components/obligation-form';

export default async function EditObligationPage({
  params,
}: {
  params: Promise<{ lang: Locale; id: string }>;
}) {
  const { lang, id } = await params;
  const { t } = await getDictionary(lang);

  const obligation = await getObligationOrNotFound(id);

  // Bind the obligation id into the update action's (id, prev, formData) shape.
  const action = updateObligation.bind(null, id);

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-9 pb-20">
      <Link
        href={`/${lang}/obligations/${id}`}
        className="mb-4 inline-block text-sm text-primary hover:underline"
      >
        ← {t.back}
      </Link>
      <h1 className="mb-5 text-2xl font-light tracking-tight">{t.editTitle}</h1>
      <ObligationForm
        action={action}
        redirectTo={`/${lang}/obligations/${id}`}
        successMessage={t.toastUpdated}
        taxIdEditable={false}
        defaults={{
          type: obligation.type,
          title: obligation.title,
          description: obligation.description,
          dueDate: obligation.dueDate,
          owner: obligation.owner,
          requiresDocument: obligation.requiresDocument,
          companyTaxId: obligation.companyTaxId,
        }}
      />
    </main>
  );
}
