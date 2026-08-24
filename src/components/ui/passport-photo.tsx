import Image from "next/image";
import { User } from "lucide-react";

interface PassportPhotoProps {
  firstName: string;
  lastName: string;
  photoUrl?: string;
  className?: string;
}

export function PassportPhoto({ firstName, lastName, photoUrl, className }: PassportPhotoProps) {
  return (
    <div
      className={`relative w-full sm:w-56 shrink-0 aspect-[3/4] rounded-2xl overflow-hidden bg-muted flex items-center justify-center ${className ?? ""}`}
    >
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={`${firstName} ${lastName}`}
          fill
          className="object-cover"
          sizes="224px"
        />
      ) : (
        <User className="w-16 h-16 text-muted-foreground/40" strokeWidth={1.25} />
      )}
    </div>
  );
}
