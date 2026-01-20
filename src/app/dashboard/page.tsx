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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-neutral-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-lg font-semibold text-neutral-900">
              Layerwise
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-neutral-900"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
              >
                Projects
              </Link>
            </nav>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Welcome */}
        <div className="mb-12">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Welcome back, {user.firstName || "there"}
          </h1>
          <p className="mt-1 text-neutral-500">
            Start a new takeoff or continue where you left off.
          </p>
        </div>

        {/* Upload Area */}
        <Link
          href="/takeoff"
          className="group mb-12 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 px-6 py-16 transition-all hover:border-neutral-300 hover:bg-neutral-50"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white transition-colors group-hover:border-neutral-300">
            <svg
              className="h-5 w-5 text-neutral-400 transition-colors group-hover:text-neutral-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>
          <span className="text-sm font-medium text-neutral-700">
            New Takeoff
          </span>
          <span className="mt-1 text-xs text-neutral-400">
            Upload PDF or image to analyze
          </span>
        </Link>

        {/* Recent Projects */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-900">Recent Projects</h2>
            <Link
              href="/projects"
              className="text-xs text-neutral-400 transition-colors hover:text-neutral-600"
            >
              View all
            </Link>
          </div>

          {/* Empty state */}
          <div className="rounded-xl border border-neutral-100 bg-neutral-50/30">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                <svg
                  className="h-5 w-5 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                  />
                </svg>
              </div>
              <p className="text-sm text-neutral-500">No projects yet</p>
              <p className="mt-1 text-xs text-neutral-400">
                Your takeoff results will appear here
              </p>
            </div>
          </div>
        </section>

        {/* Quick Info */}
        <section className="mt-12 grid gap-px overflow-hidden rounded-xl border border-neutral-100 bg-neutral-100 md:grid-cols-4">
          <div className="bg-white p-6">
            <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Count
            </div>
            <div className="mt-1 text-sm text-neutral-600">
              Doors, windows, fixtures
            </div>
          </div>
          <div className="bg-white p-6">
            <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Linear
            </div>
            <div className="mt-1 text-sm text-neutral-600">
              Walls, pipes, wiring
            </div>
          </div>
          <div className="bg-white p-6">
            <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Area
            </div>
            <div className="mt-1 text-sm text-neutral-600">
              Floors, roofing, paint
            </div>
          </div>
          <div className="bg-white p-6">
            <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Volume
            </div>
            <div className="mt-1 text-sm text-neutral-600">
              Concrete, excavation
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
