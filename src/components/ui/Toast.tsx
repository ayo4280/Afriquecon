import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onDismiss: () => void;
}

export default function Toast({ message, type = 'info', onDismiss }: ToastProps) {
  const styles = {
    success: 'border-emerald-500/40 bg-emerald-950/95 text-emerald-100',
    error: 'border-red-500/40 bg-red-950/95 text-red-100',
    info: 'border-blue-500/40 bg-blue-950/95 text-blue-100',
  }[type];
  const Icon = type === 'success' ? CheckCircle : XCircle;

  return (
    <div role="status" className={`fixed right-4 top-4 z-[100] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl ${styles}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss notification" className="opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
