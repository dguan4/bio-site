"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AboutTab from "@/components/tabs/AboutTab";
import GitHubTab from "@/components/tabs/GitHubTab";
import ProjectsTab from "@/components/tabs/ProjectsTab";
import FlashcardsTab from "@/components/tabs/FlashcardsTab";
import DeadlockTab from "@/components/tabs/DeadlockTab";
import MoreTab from "@/components/tabs/MoreTab";
import type { Profile } from "@/lib/types";

interface Props {
  profile: Profile;
  githubAvatar?: string;
}

const TABS = [
  { value: "about",      label: "About" },
  { value: "github",     label: "GitHub" },
  { value: "projects",   label: "Projects" },
  { value: "flashcards", label: "Flashcards" },
  { value: "deadlock",   label: "Deadlock" },
  { value: "more",       label: "More" },
] as const;

type TabValue = typeof TABS[number]["value"];
const TAB_VALUES = TABS.map((t) => t.value) as string[];

export default function PortfolioTabs({ profile, githubAvatar }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTab = searchParams.get("tab") ?? "";
  const activeTab: TabValue = TAB_VALUES.includes(rawTab) ? (rawTab as TabValue) : "about";

  function onTabChange(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="mb-6 flex w-full overflow-x-auto">
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value} className="flex-1 min-w-max">
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="about">
        <AboutTab profile={profile} githubAvatar={githubAvatar} />
      </TabsContent>

      <TabsContent value="github">
        <GitHubTab />
      </TabsContent>

      <TabsContent value="projects">
        <ProjectsTab projectOverrides={profile.projectOverrides} />
      </TabsContent>

      <TabsContent value="flashcards">
        <FlashcardsTab />
      </TabsContent>

      <TabsContent value="deadlock">
        <DeadlockTab />
      </TabsContent>

      <TabsContent value="more">
        <MoreTab />
      </TabsContent>
    </Tabs>
  );
}
