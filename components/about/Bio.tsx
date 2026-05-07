import Image from "next/image";
import { MapPin, Mail } from "lucide-react";
import type { Profile } from "@/lib/types";

interface Props {
  profile: Profile;
  githubAvatar?: string;
}

export default function Bio({ profile, githubAvatar }: Props) {
  const avatarSrc = profile.avatar || githubAvatar;

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      {avatarSrc && (
        <div className="shrink-0">
          <Image
            src={avatarSrc}
            alt={profile.name}
            width={96}
            height={96}
            className="rounded-full ring-2 ring-border"
            unoptimized={!avatarSrc.startsWith("https://avatars.githubusercontent.com")}
          />
        </div>
      )}

      <div className="flex-1 space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
          <p className="text-muted-foreground">{profile.title}</p>
        </div>

        <p className="text-sm leading-relaxed max-w-prose">{profile.bio}</p>

        <div className="flex flex-wrap gap-3 pt-1 text-sm text-muted-foreground">
          {profile.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {profile.location}
            </span>
          )}
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              {profile.email}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
