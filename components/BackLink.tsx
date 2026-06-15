import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export default function BackLink({ href, className = "", children }: Props) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 text-sm text-pitch-500 dark:text-chalk-400 hover:text-pitch-900 dark:hover:text-chalk-100 transition-colors ${className}`}
    >
      <ArrowLeft size={15} strokeWidth={2} />
      {children}
    </Link>
  );
}
