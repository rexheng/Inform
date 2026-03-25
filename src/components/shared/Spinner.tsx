export default function Spinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-nhs-light-grey border-t-nhs-blue" />
      {message && <p className="text-sm text-nhs-grey">{message}</p>}
    </div>
  );
}
