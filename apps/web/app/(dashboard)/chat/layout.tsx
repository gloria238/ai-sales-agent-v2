/**
 * Chat layout — minimal header, no sidebar clutter.
 * Used by sales agents (Dashboard) to chat with customers in real-time.
 */
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-4 lg:-m-8">
      {children}
    </div>
  );
}
