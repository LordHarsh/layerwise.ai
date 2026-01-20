import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <header className="border-b border-neutral-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </div>
            <span className="text-xl font-semibold text-neutral-900">Layerwise</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 items-center">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2 lg:gap-24">
          {/* Left: Copy */}
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              AI-Powered Construction Estimating
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              Blueprint takeoffs
              <span className="text-blue-600"> in seconds</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-neutral-600">
              Upload your construction blueprints and extract quantities instantly.
              Doors, windows, walls, areas — measured and counted automatically.
            </p>
            <div className="mt-8">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700"
              >
                Start Analyzing
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-neutral-500">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                PDF & Image Support
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Auto Scale Detection
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Export to CSV
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-lg">
              {/* Blueprint preview card */}
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-xl">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">Takeoff Results</span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Complete
                  </span>
                </div>

                {/* Results */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                        <span className="text-sm">🚪</span>
                      </div>
                      <span className="text-sm font-medium text-neutral-800">Interior Doors</span>
                    </div>
                    <span className="font-semibold text-neutral-900">12 ea</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                        <span className="text-sm">📏</span>
                      </div>
                      <span className="text-sm font-medium text-neutral-800">Interior Walls</span>
                    </div>
                    <span className="font-semibold text-neutral-900">248 LF</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                        <span className="text-sm">📐</span>
                      </div>
                      <span className="text-sm font-medium text-neutral-800">Floor Area</span>
                    </div>
                    <span className="font-semibold text-neutral-900">2,450 SF</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                        <span className="text-sm">🪟</span>
                      </div>
                      <span className="text-sm font-medium text-neutral-800">Windows</span>
                    </div>
                    <span className="font-semibold text-neutral-900">8 ea</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4">
                  <span className="text-xs text-neutral-500">Scale: 1/4" = 1'-0"</span>
                  <span className="text-xs text-neutral-500">Analyzed in 4.2s</span>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -right-4 -top-4 -z-10 h-72 w-72 rounded-full bg-blue-100 opacity-50 blur-3xl" />
              <div className="absolute -bottom-4 -left-4 -z-10 h-72 w-72 rounded-full bg-purple-100 opacity-50 blur-3xl" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
