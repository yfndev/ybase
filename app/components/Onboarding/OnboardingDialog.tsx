import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { DialogClose } from "@radix-ui/react-dialog";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [step, setStep] = useState<"name" | "address">("name");
  const [street, setStreet] = useState("");
  const [plz, setPlz] = useState("");
  const [city, setCity] = useState("");
  const [accountingEmail, setAccountingEmail] = useState("");

  const orgCheck = useQuery(api.organizations.queries.getOrganizationByDomain);

  const initializeOrganization = useMutation(api.organizations.functions.initializeOrganization);
  const updateOrganization = useMutation(api.organizations.functions.updateOrganization);

  const isJoiningExisting = orgCheck?.exists === true;

  const handleSubmitName = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await initializeOrganization({
        organizationName: name.trim() || undefined,
      });

      if (!result?.organizationId) {
        toast.error("Fehler beim Einrichten der Organisation");
        return;
      }

      if (result.isNew) {
        toast.success("Willkommen bei YBudget! 🥳");
        setStep("address");
      } else {
        toast.success("Willkommen im Team! 🥳");
        onOpenChange(false);
      }
    } catch {
      toast.error("Fehler beim Einrichten");
    }
  };

  const handleSubmitAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateOrganization({
        street: street.trim() || undefined,
        plz: plz.trim() || undefined,
        city: city.trim() || undefined,
        accountingEmail: accountingEmail.trim() || undefined,
      });
      toast.success("Adresse gespeichert");
    } catch {
      toast.error("Fehler beim Speichern der Adresse");
    }

    onOpenChange(false);
  };

  if (step === "address") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmitAddress}>
            <DialogHeader>
              <DialogTitle>Vereinsadresse</DialogTitle>
              <DialogDescription>
                Die Adresse deines Vereins wird auf Ehrenamtspauschalen-Dokumenten angezeigt.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 mt-4">
              <div>
                <Label htmlFor="street">Straße</Label>
                <Input
                  id="street"
                  placeholder="Musterstraße 1"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="plz">PLZ</Label>
                  <Input
                    id="plz"
                    placeholder="12345"
                    value={plz}
                    onChange={(e) => setPlz(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Stadt</Label>
                  <Input
                    id="city"
                    placeholder="Berlin"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="accountingEmail">Buchhaltungs-E-Mail (optional)</Label>
                <Input
                  id="accountingEmail"
                  type="email"
                  placeholder="buchhaltung@verein.de"
                  value={accountingEmail}
                  onChange={(e) => setAccountingEmail(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="mt-8">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Überspringen
              </Button>
              <Button type="submit">Speichern</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmitName}>
          <DialogHeader>
            <DialogTitle>
              {isJoiningExisting
                ? "Organisation beitreten"
                : "Willkommen bei YBudget :)"}
            </DialogTitle>
            <DialogDescription>
              {isJoiningExisting
                ? `Du wirst der Organisation "${orgCheck.organizationName}" als Betrachter hinzugefügt. Ein Administrator kann deine Rolle später ändern.`
                : "Lass uns direkt loslegen und deinen Verein einrichten."}
            </DialogDescription>
          </DialogHeader>

          {!isJoiningExisting && (
            <div className="grid gap-3 mt-4">
              <Label htmlFor="name-1">Wie heißt dein Verein?</Label>
              <Input
                id="name-1"
                name="name"
                placeholder="Young Founders Network e.V."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <DialogFooter className="mt-8">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Abbrechen
              </Button>
            </DialogClose>
            <Button type="submit">
              {isJoiningExisting ? "Beitreten" : "Loslegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
