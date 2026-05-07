import { Suspense } from "react";
import PortfolioTabs from "@/components/PortfolioTabs";
import profileData from "@/profile.json";
import type { Profile } from "@/lib/types";

// Strip internal _notes key before passing to components
function getProfile(): Profile {
  const { _notes: _ignored, ...rest } = profileData as typeof profileData & { _notes?: unknown };
  return rest as Profile;
}

export default function Home() {
  const profile = getProfile();

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Suspense>
        <PortfolioTabs profile={profile} />
      </Suspense>
    </main>
  );
}
