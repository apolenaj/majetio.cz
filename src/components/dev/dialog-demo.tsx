"use client";

import * as React from "react";

import { AlertDialog, Dialog, DialogContent, DialogTrigger } from "@/components/overlays/dialog";
import { Button } from "@/components/ui/button";

export function DialogDemo() {
  const [alertOpen, setAlertOpen] = React.useState(false);

  return (
    <div className="flex flex-wrap gap-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" variant="secondary">
            Otevřít dialog
          </Button>
        </DialogTrigger>
        <DialogContent
          title="Vysvětlení metriky"
          description="Hrubý výnos je roční nájemné dělené kupní cenou — před náklady a financováním."
        >
          <p className="text-sm text-[var(--text-secondary)]">
            Na mobilu je důležité vysvětlení dostupné i mimo tooltip — například v dialogu
            nebo rozbalení.
          </p>
        </DialogContent>
      </Dialog>

      <Button type="button" variant="outline" onClick={() => setAlertOpen(true)}>
        Potvrzovací dialog
      </Button>
      <AlertDialog
        open={alertOpen}
        onOpenChange={setAlertOpen}
        title="Odebrat z porovnání?"
        description="Nemovitost zmizí z porovnávacího přehledu. Můžete ji kdykoli přidat znovu."
        confirmLabel="Odebrat"
        destructive
        onConfirm={() => undefined}
      />
    </div>
  );
}
