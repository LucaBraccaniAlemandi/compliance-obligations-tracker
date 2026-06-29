import Link from 'next/link';
import { createObligation } from '@/app/lib/actions';
import { getDictionary } from '@/app/lib/dictionaries/get';
import type { Locale } from '@/app/lib/dictionaries/config';
import { ObligationForm } from '../components/obligation-form';

export default async function NewObligationPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const { t } = await getDictionary(lang);

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-9 pb-20">
      <Link
        href={`/${lang}/obligations`}
        className="mb-4 inline-block text-sm text-primary hover:underline"
      >
        ← {t.back}
      </Link>
      <h1 className="mb-5 text-2xl font-light tracking-tight">{t.createTitle}</h1>
      <ObligationForm
        action={createObligation}
        redirectTo={`/${lang}/obligations`}
        successMessage={t.toastCreated}
      />
    </main>
  );
}
