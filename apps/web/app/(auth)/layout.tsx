export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg relative overflow-hidden">
      {/* Ambient gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 size-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-96 rounded-full bg-primary/5 blur-3xl" />
      </div>
      <div className="w-full max-w-sm relative z-10 px-4">{children}</div>
    </div>
  );
}
