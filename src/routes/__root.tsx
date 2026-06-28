import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="max-w-md text-center">
        <div className="font-serif text-7xl text-primary">404</div>
        <h2 className="mt-4 font-serif text-xl text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">No record matches this path in the workbench.</p>
        <Link to="/dashboard" className="mt-6 inline-flex rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">Return to dashboard</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-xl text-primary">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">An error occurred rendering this view.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">Try again</button>
          <a href="/" className="rounded-sm border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Drishti — Analyst Workbench" },
      { name: "description", content: "Secure offline multilingual OSINT retrieval workbench. Academic prototype." },
      { name: "author", content: "Drishti — NTCC project" },
      { property: "og:title", content: "Drishti — Analyst Workbench" },
      { property: "og:description", content: "Secure offline multilingual OSINT retrieval workbench." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600&family=Noto+Sans+Tamil:wght@400;500;600&family=Noto+Naskh+Arabic:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
