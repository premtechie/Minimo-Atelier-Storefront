export function Offline({ ok }: { ok: boolean }) {
  if (ok) return null;
  return (
    <p className="m-offline" role="status">
      Our shelves are being restocked online right now. Please check back in a minute, or message us on WhatsApp.
    </p>
  );
}
