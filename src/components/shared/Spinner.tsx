export default function Spinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-cp-border border-t-cp-dark" />
      {message && <p className="text-sm text-cp-text-muted">{message}</p>}
    </div>
  );
}
