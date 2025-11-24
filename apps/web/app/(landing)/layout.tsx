import { Toaster } from "sonner";

import { Footer } from "@/components/organisms/footer";
import { StickyHeader } from "@/components/organisms/sticky-header";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      <StickyHeader />

      {children}

      <Footer />

      <Toaster />
    </main>
  );
}
