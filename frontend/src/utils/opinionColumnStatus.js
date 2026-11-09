export const STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador' },
  { value: 'pending_review', label: 'Pendiente de revisión' },
  { value: 'changes_requested', label: 'Solicitar cambios' },
  { value: 'published', label: 'Publicada' },
  { value: 'rejected', label: 'Rechazada' },
];

export function getStatusClasses(status) {
  switch (status) {
    case 'draft':
      return 'bg-slate-200 text-slate-700';
    case 'pending_review':
      return 'bg-amber-100 text-amber-800';
    case 'changes_requested':
      return 'bg-orange-100 text-orange-800';
    case 'published':
      return 'bg-emerald-100 text-emerald-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}
