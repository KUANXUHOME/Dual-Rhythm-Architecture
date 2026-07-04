// proxy.ts — Clerk auth: protect agent + dashboard + admin + API routes
// Next.js 16 renamed the middleware.ts file convention to proxy.ts (see nextjs.org/docs/messages/middleware-to-proxy)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtected = createRouteMatcher([
  '/agent(.*)',
  '/dashboard(.*)',
  '/board-rhythm(.*)',
  '/admin(.*)',
  '/api/chat(.*)',
  '/api/assess(.*)',
  '/api/assessments(.*)',
  '/api/report(.*)',
  '/api/usage(.*)',
  '/api/admin(.*)',
  '/api/benchmark(.*)',
  '/api/board-brief(.*)',
  '/api/conversations(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
