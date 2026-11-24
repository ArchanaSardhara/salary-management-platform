import { WalletCardsIcon } from "lucide-react";
import { cn } from "cn";
import Image from "next/image";

interface BrandLogoProps {
  className?: string;
  /** Hide the product name, e.g. in a collapsed sidebar. */
  iconOnly?: boolean;
  sideBar?: boolean;
}

export function BrandLogo({
  className,
  iconOnly = false,
  sideBar = false,
}: BrandLogoProps) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 font-semibold",
        sideBar ? "" : "flex-col",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg text-primary-foreground",
          sideBar ? "size-6" : "",
        )}
      >
        <Image
          src="/images/android-chrome-512x512.png"
          alt="Salary Management Platform Logo"
          width={60}
          height={60}
        />
      </span>
      <span className={cn("text-xl truncate", iconOnly && "sr-only")}>
        Salary Management
      </span>
    </span>
  );
}
