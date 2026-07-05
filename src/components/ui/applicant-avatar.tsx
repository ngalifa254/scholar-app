import Image from "next/image";
import { getInitials } from "@/lib/utils";

interface ApplicantAvatarProps {
  firstName: string;
  lastName: string;
  photoUrl?: string;
  size?: number;
  className?: string;
}

export function ApplicantAvatar({
  firstName,
  lastName,
  photoUrl,
  size = 32,
  className,
}: ApplicantAvatarProps) {
  return (
    <div
      style={{ width: size, height: size, minWidth: size }}
      className={`relative rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 ${className ?? ""}`}
    >
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={`${firstName} ${lastName}`}
          fill
          className="object-cover"
          sizes={`${size}px`}
        />
      ) : (
        <span
          className="text-primary font-semibold select-none"
          style={{ fontSize: Math.round(size * 0.32) }}
        >
          {getInitials(firstName, lastName)}
        </span>
      )}
    </div>
  );
}
