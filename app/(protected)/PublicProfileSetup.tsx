"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  completePublicProfile,
  generateProfileImageUpload,
} from "@/lib/server/profile/actions";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";

interface Props {
  canUseGooglePhoto: boolean;
}

export function PublicProfileSetup({ canUseGooglePhoto }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [loading, setLoading] = useState(canUseGooglePhoto);
  const [syncFailed, setSyncFailed] = useState(false);
  const syncingGooglePhoto = useRef(false);

  const syncGooglePhoto = useCallback(async () => {
    if (syncingGooglePhoto.current) return;
    syncingGooglePhoto.current = true;
    setLoading(true);
    setSyncFailed(false);
    try {
      await completePublicProfile({ source: "google" });
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Etwas ist schiefgelaufen",
      );
      syncingGooglePhoto.current = false;
      setLoading(false);
      setSyncFailed(true);
    }
  }, [router]);

  useEffect(() => {
    if (canUseGooglePhoto) void syncGooglePhoto();
  }, [canUseGooglePhoto, syncGooglePhoto]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const upload = await generateProfileImageUpload(file.type);
      const response = await fetch(upload.url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Der Upload ist fehlgeschlagen");
      await completePublicProfile({
        source: "upload",
        storageKey: upload.key,
      });
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Etwas ist schiefgelaufen",
      );
      setLoading(false);
    }
  };

  if (canUseGooglePhoto) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        {syncFailed ? (
          <Button onClick={() => void syncGooglePhoto()}>
            Erneut versuchen
          </Button>
        ) : (
          <Loader2
            aria-label="Profilbild wird übernommen"
            className="size-6 animate-spin"
          />
        )}
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Camera aria-hidden="true" className="size-6" />
          </div>
          <CardTitle className="text-2xl">Profilbild hinzufügen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfilePhotoUpload
            previewUrl={previewUrl}
            hasFile={Boolean(file)}
            onFileChange={(selected) => {
              if (selected.size > 5 * 1024 * 1024) {
                toast.error("Das Profilbild darf maximal 5 MB groß sein");
                return;
              }
              setFile(selected);
            }}
          />
          <Button
            className="w-full"
            disabled={loading || !file}
            onClick={() => void submit()}
          >
            {loading ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : null}
            Speichern
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
