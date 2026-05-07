import { Separator } from "@/components/ui/separator";
import Bio from "@/components/about/Bio";
import Skills from "@/components/about/Skills";
import ExperienceTimeline from "@/components/about/ExperienceTimeline";
import SocialLinks from "@/components/about/SocialLinks";
import type { Profile } from "@/lib/types";

interface Props {
  profile: Profile;
  githubAvatar?: string;
}

export default function AboutTab({ profile, githubAvatar }: Props) {
  return (
    <div className="space-y-8">
      <Bio profile={profile} githubAvatar={githubAvatar} />

      {profile.social.length > 0 && (
        <>
          <Separator />
          <SocialLinks social={profile.social} />
        </>
      )}

      {profile.skills.length > 0 && (
        <>
          <Separator />
          <Skills skills={profile.skills} />
        </>
      )}

      {profile.experience.length > 0 && (
        <>
          <Separator />
          <ExperienceTimeline experience={profile.experience} />
        </>
      )}
    </div>
  );
}
