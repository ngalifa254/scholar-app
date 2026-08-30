"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PassportPhoto } from "@/components/ui/passport-photo";
import type { Scholar } from "@/types";

interface Props {
  scholars: Scholar[];
}

export default function ScholarShowcase({ scholars }: Props) {
  if (scholars.length === 0) {
    return (
      <main className="flex-1 px-6 lg:px-8 pb-6 lg:pb-8">
        <Card>
          <CardContent className="p-12 flex flex-col items-center text-center gap-3">
            <Sparkles className="w-8 h-8 text-muted-foreground/50" />
            <p className="font-medium">No scholars featured yet</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Open a scholar&apos;s edit page and check &ldquo;Feature this scholar on the Showcase
              page&rdquo; to add them here.
            </p>
            <Link href="/scholars" className="text-sm text-primary hover:underline">
              Back to Scholars
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 px-6 lg:px-8 pb-6 lg:pb-8 space-y-6">
      {scholars.map((scholar, i) => (
        <motion.div
          key={scholar.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08 } }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <PassportPhoto
                  firstName={scholar.firstName}
                  lastName={scholar.lastName}
                  photoUrl={scholar.profilePhotoUrl}
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold">
                    {scholar.firstName} {scholar.lastName}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Grade {scholar.grade} · {scholar.school}
                  </p>
                  {scholar.thankYouNote ? (
                    <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">
                      {scholar.thankYouNote}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground italic">No story shared yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </main>
  );
}
