import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-muted/40 px-4 py-10 sm:px-6">
      <main className="flex w-full max-w-md flex-col items-center gap-6">
        <Link
          href="/"
          className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <BrandLogo />
        </Link>
        {children}
      </main>
    </div>
  );
}
