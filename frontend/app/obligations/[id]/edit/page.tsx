import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getObligation } from '@/app/lib/obligations';
import { updateObligation } from '@/app/lib/actions';
import { ApiError } from '@/app/lib/api';
import { t } from '@/app/lib/strings';
import { ObligationForm } from '../../obligation-form';

export default async function EditObligationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let obligation;
  try {
    obligation = await getObligation(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  // Bind the obligation id into the update action's (id, prev, formData) shape.
  const action = updateObligation.bind(null, id);

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-9 pb-20">
      <Link
        href={`/obligations/${id}`}
        className="mb-4 inline-block text-sm text-primary hover:underline"
      >
        ← {t.back}
      </Link>
      <h1 className="mb-5 text-2xl font-light tracking-tight">{t.editTitle}</h1>
      <ObligationForm
        action={action}
        redirectTo={`/obligations/${id}`}
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
