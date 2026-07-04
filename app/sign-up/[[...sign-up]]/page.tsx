// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs';
export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#F0FDF4] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-xs font-bold tracking-widest uppercase text-[#0F1A14] mb-1">Dual-Rhythm Architecture™</div>
          <p className="text-sm text-[#4B5563]">Create your account to begin</p>
        </div>
        <SignUp appearance={{ variables: { colorPrimary: '#0A6640' } }} />
      </div>
    </main>
  );
}
