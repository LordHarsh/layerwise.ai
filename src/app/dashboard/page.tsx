import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold">Layerwise</h1>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900">
            Welcome, {user.firstName || "User"}
          </h2>
          <p className="mt-1 text-neutral-600">
            Upload a blueprint to get started with AI-powered takeoff analysis.
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* New Takeoff Card */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              New Takeoff
            </h3>
            <p className="mt-1 text-sm text-neutral-600">
              Upload a blueprint PDF or image to start a new quantity takeoff.
            </p>
            <Link
              href="/takeoff"
              className="mt-4 block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
            >
              Start New Takeoff
            </Link>
          </div>

          {/* Recent Projects Card */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100">
              <svg
                className="h-6 w-6 text-neutral-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Recent Projects
            </h3>
            <p className="mt-1 text-sm text-neutral-600">
              No projects yet. Start by uploading your first blueprint.
            </p>
          </div>

          {/* Help Card */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              How It Works
            </h3>
            <p className="mt-1 text-sm text-neutral-600">
              Our AI analyzes blueprints to extract counts, linear measurements,
              areas, and volumes.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-neutral-600">
              <li>• Count: Doors, windows, fixtures</li>
              <li>• Linear: Walls, pipes, trim</li>
              <li>• Area: Floors, surfaces</li>
              <li>• Volume: Concrete, excavation</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
