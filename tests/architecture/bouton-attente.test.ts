import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * UN FORMULAIRE DIT TOUJOURS QU'IL A ÉTÉ ENTENDU.
 *
 * Signalé à l'usage : « quand je clique sur lancer la partie, rien n'indique
 * que la commande a été reçue ». Créer une partie écrit des équipes, des
 * concurrents et six tours ; clôturer un tour fait tourner la simulation pour
 * toute la classe. Pendant ce temps, un bouton ordinaire ne bouge pas d'un
 * pixel, l'utilisateur croit son clic perdu, et il reclique.
 *
 * Les composants CLIENTS savaient déjà se taire pendant l'attente : ils ont
 * l'état de l'action sous la main. Les PAGES SERVEUR, non : leur bouton est du
 * HTML statique. C'est là que le défaut vivait, et c'est ce que garde ce test.
 *
 * La règle : dans une page serveur, un bouton de soumission passe par
 * `SubmitButton`, qui lit `useFormStatus` depuis l'intérieur du formulaire.
 */

function pages(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...pages(chemin));
    else if (entree.endsWith(".tsx")) trouves.push(chemin);
  }
  return trouves;
}

describe("retour au clic sur un formulaire", () => {
  const fichiers = pages("src/app").map((chemin) => ({
    chemin,
    source: readFileSync(chemin, "utf-8"),
  }));

  it("les sources de pages sont bien trouvées", () => {
    expect(fichiers.length, "aucune page trouvée").toBeGreaterThan(8);
  });

  it("aucune page serveur ne pose un bouton de soumission muet", () => {
    const fautes = fichiers
      .filter(({ source }) => !source.includes('"use client"'))
      .filter(({ source }) => source.includes('type="submit"'))
      .map(({ chemin }) => chemin);
    expect(
      fautes,
      `bouton de soumission sans état d'attente dans :\n${fautes.join("\n")}\n` +
        "Utilisez SubmitButton, qui se désactive et l'annonce pendant l'action.",
    ).toEqual([]);
  });

  it("le bouton partagé se désactive et le fait savoir aux lecteurs d'écran", () => {
    // Sans `disabled`, deux clics créent deux parties. Sans `aria-busy`, un
    // lecteur d'écran n'annonce rien du tout.
    const source = readFileSync("src/components/submit-button.tsx", "utf-8");
    expect(source, "le bouton ne lit pas l'état du formulaire").toContain("useFormStatus");
    expect(source, "le bouton ne se désactive pas pendant l'attente").toContain("disabled={pending");
    expect(source, "aucune annonce pour les lecteurs d'écran").toContain("aria-busy={pending}");
  });
});
