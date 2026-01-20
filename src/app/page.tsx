import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  // Redirect logged-in users to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold">Layerwise</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
            AI-Powered Blueprint
            <span className="block text-blue-600">Quantity Takeoff</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
            Upload your construction blueprints and let AI extract all the
            measurements you need. Count doors, windows, calculate wall lengths,
            floor areas, and more in seconds.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="rounded-md border border-neutral-300 px-8 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="mt-24">
          <h2 className="text-center text-3xl font-bold text-neutral-900">
            What We Extract
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-neutral-600">
            Our AI analyzes architectural drawings to extract four types of
            measurements used in construction estimating.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Count */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <span className="text-2xl">🚪</span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Count</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Individual items like doors, windows, fixtures, and electrical
                outlets.
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                Units: each (ea), pieces (pcs)
              </p>
            </div>

            {/* Linear */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <span className="text-2xl">📏</span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Linear</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Length measurements for walls, pipes, wiring, and trim work.
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                Units: linear feet (LF), meters (m)
              </p>
            </div>

            {/* Area */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <span className="text-2xl">📐</span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Area</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Surface measurements for floors, walls, roofing, and paint.
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                Units: square feet (SF), square meters (m²)
              </p>
            </div>

            {/* Volume */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Volume</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Cubic measurements for concrete, excavation, and fill.
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                Units: cubic feet (CF), cubic yards (CY)
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mt-24">
          <h2 className="text-center text-3xl font-bold text-neutral-900">
            How It Works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                1
              </div>
              <h3 className="mt-4 text-lg font-semibold">Upload Blueprint</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Upload your PDF or image file. We support multi-page documents.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                2
              </div>
              <h3 className="mt-4 text-lg font-semibold">AI Analysis</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Our AI detects and measures all construction elements in
                real-time.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                3
              </div>
              <h3 className="mt-4 text-lg font-semibold">Export Results</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Download your takeoff as CSV or Excel for use in estimating
                software.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-24 rounded-lg bg-blue-600 p-12 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to streamline your takeoffs?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-blue-100">
            Join contractors and estimators who are saving hours on every
            project with AI-powered blueprint analysis.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-block rounded-md bg-white px-8 py-3 text-base font-medium text-blue-600 hover:bg-blue-50"
          >
            Get Started Free
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-neutral-600">
          <p>&copy; {new Date().getFullYear()} Layerwise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
