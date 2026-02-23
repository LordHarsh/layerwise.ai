import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { Layers } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="earth-linen-bg flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-[#e2d5c3] bg-[#faf7f2]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#c2410c]">
              <Layers className="size-5 text-white" />
            </div>
            <span className="earth-serif text-xl font-bold text-[#292018]">
              Layerwise
            </span>
          </Link>
          <Link
            href="/sign-in"
            className="text-sm font-medium text-[#78716c] transition-colors hover:text-[#c2410c]"
          >
            Already have an account?
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="earth-fade-up mb-8 text-center">
          <h1 className="earth-serif text-3xl font-bold text-[#292018]">
            Start your journey
          </h1>
          <p className="mt-2 text-[#78716c]">
            Create an account to begin analyzing blueprints
          </p>
        </div>
        <div className="earth-fade-up earth-fade-up-delay-1">
          <SignUp />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#e2d5c3]">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-6">
          <p className="text-xs text-[#a8a29e]">
            &copy; {new Date().getFullYear()} Layerwise. AI-powered blueprint takeoffs.
          </p>
        </div>
      </footer>
    </div>
  );
}
