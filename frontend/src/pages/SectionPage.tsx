import { PageHeader } from '../components/PageHeader';
import type { Section } from '../routes/navigation';

/**
 * Página provisoria de una sección todavía no implementada (S1-04).
 * Indica en qué sprint se construye, para que la navegación sea honesta.
 */
export function SectionPage({ section }: { section: Section }) {
  return (
    <>
      <PageHeader title={section.label} subtitle={section.description} />
      <div role="status" className="rounded-lg border border-dashed border-marca-200 bg-marca-50 p-6">
        <p className="font-medium text-marca-900">Sección en construcción</p>
        <p className="mt-1 text-sm text-slate-600">
          Se implementa en el Sprint {section.sprint} ({section.requisitos}).
        </p>
      </div>
    </>
  );
}
