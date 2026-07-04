// components/chat/UsageBanner.tsx
interface Props { upgradeLink: string; }
export function UsageBanner({ upgradeLink }: Props) {
  return (
    <div className="bg-warning/10 border-b border-warning/30 px-4 py-2.5 flex items-center justify-between gap-3">
      <p className="text-xs text-amber-800 font-medium">
        You&apos;ve reached today&apos;s free usage limit (20 messages).
      </p>
      <a href={upgradeLink} className="text-xs font-bold text-amber-800 border border-amber-600 px-3 py-1.5 rounded-brand hover:bg-amber-100 transition-all whitespace-nowrap">
        Upgrade $299 →
      </a>
    </div>
  );
}
