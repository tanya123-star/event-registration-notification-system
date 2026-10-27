import { notFound } from "next/navigation";

interface PreviewsGateLayoutProps {
  children: React.ReactNode;
}

export default function PreviewsGateLayout({ children }: PreviewsGateLayoutProps) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return children;
}
