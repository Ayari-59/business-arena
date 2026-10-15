import { chiffrerLeMontage, jugerLeMontage, motifDuPaiement, type ChiffresDuMontage } from "@/engine/groupe";
import type { CibleDeRachat, ConfigDeGroupe, DecisionDeRachat } from "@/engine/groupe/types";
import type { CibleVue, VueDuGroupe } from "@/services/groupe-view.service";

/**
 * CE QUE LE MOTEUR DIRAIT D'UNE OFFRE DE RACHAT, AVANT L'ENVOI (niveau 7).
 *
 * La feuille de décision juge l'offre saisie des MÊMES fonctions que le moteur
 * au jour 1 (`engine/groupe/rachat` : `motifDuPaiement`, `jugerLeMontage`), sur
 * l'état d'ouverture que la vue du groupe porte. Le verdict est donc celui du
 * moteur, à une exception près, qu'on dit : en classe, une autre équipe peut
 * offrir davantage pour la même cible.
 *
 * Les critères détaillés (prix, contrôle, trésorerie, plafond de la banque,
 * découvert) se lisent des chiffres du montage (`chiffrerLeMontage`), ceux-là
 * mêmes que le moteur juge : un critère au rouge et un verdict favorable ne
 * peuvent pas coexister (`tests/unit/groupe-eligibilite.test.ts`).
 */

export type CleDuCritere = "tour" | "cible" | "paiement" | "prix" | "controle" | "tresorerie" | "plafond" | "decouvert";

export interface CritereDuRachat {
  cle: CleDuCritere;
  libelle: string;
  ok: boolean;
  detail: string;
}

export interface EligibiliteDuRachat {
  cible: CibleVue;
  /** Le prix demandé pour la part visée ; `null` si la cible n'est plus à vendre. */
  prix: number | null;
  criteres: CritereDuRachat[];
  /** Le motif du refus, tel que le moteur l'écrirait ; `null` : l'offre est recevable. */
  motif: string | null;
  chiffres: ChiffresDuMontage | null;
}

export interface OffreSaisie {
  cible: CibleDeRachat;
  paiement: DecisionDeRachat["paiement"];
  prixMaximum: number;
  emprunt?: number;
  augmentationDeCapital?: number;
  part?: number;
}

const euros = (n: number) =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n)).replace(/^-/, "−")} €`;
const pourCent = (x: number) => `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(x * 100)} %`;

/** Les règles de rachat de la vue, au format de la configuration que le moteur lit. */
function reglesDuMoteur(r: NonNullable<VueDuGroupe["regles"]>): NonNullable<ConfigDeGroupe["rachat"]> {
  return {
    primeDeControle: r.primeDeControle,
    fraisDeTransaction: r.fraisDeTransaction,
    decoteDEmission: r.decoteDEmission,
    seuilDeControle: r.seuilDeControle,
    tourMin: r.tourMin,
    tourMinTitres: r.tourMinTitres,
  };
}

/** Le prix demandé pour une cible et une part ; `null` si elle n'est plus à vendre ou que la part n'est pas proposée. */
export function prixDeLaCible(c: CibleVue, part: number | undefined): number | null {
  if (c.statut !== "disponible") return null;
  if (c.type !== "etranger") return c.prixDemande;
  const p = part ?? 1;
  return c.etranger?.prixDesParts.find((x) => Math.abs(x.part - p) < 1e-9)?.prix ?? null;
}

export function eligibiliteDuRachat(vue: VueDuGroupe, offre: OffreSaisie): EligibiliteDuRachat | null {
  const cible = vue.cibles.find((c) => c.type === offre.cible.type && c.id === offre.cible.id);
  if (!cible || !vue.regles || !vue.ouverture) return null;
  const o = vue.ouverture;
  const cfg = reglesDuMoteur(vue.regles);
  const criteres: CritereDuRachat[] = [];
  const motifs: string[] = [];
  const poser = (c: CritereDuRachat, motif?: string) => {
    criteres.push(c);
    if (!c.ok && motif) motifs.push(motif);
  };

  // Les jugements d'avant le montage, dans l'ordre du moteur.
  const tourOk = o.tour >= cfg.tourMin && o.tour < o.dernierTour;
  poser(
    {
      cle: "tour",
      libelle: "Tour",
      ok: tourOk,
      detail:
        o.tour < cfg.tourMin
          ? `Un rachat se décide à partir du tour ${cfg.tourMin}.`
          : o.tour >= o.dernierTour
            ? "Un rachat au dernier tour ne se jugerait sur rien."
            : `Tour ${o.tour} : les rachats sont ouverts.`,
    },
    o.tour < cfg.tourMin
      ? `Un rachat se décide à partir du tour ${cfg.tourMin}.`
      : "Un rachat au dernier tour ne se jugerait sur rien.",
  );
  const prix = prixDeLaCible(cible, offre.part);
  poser(
    {
      cle: "cible",
      libelle: "Cible",
      ok: prix !== null,
      detail:
        cible.statut === "a_vous"
          ? "Elle est déjà à vous."
          : cible.statut === "vendue"
            ? "Une autre entreprise l'a déjà rachetée."
            : prix === null
              ? "Cette part n'est pas à vendre."
              : `Le vendeur demande ${euros(prix)}.`,
    },
    cible.statut !== "disponible" ? "Cette cible n'est pas à vendre." : "Cette part n'est pas à vendre.",
  );
  const refusDuPaiement = motifDuPaiement(cfg, o.tour, cible.type, offre.paiement);
  poser(
    {
      cle: "paiement",
      libelle: "Paiement",
      ok: refusDuPaiement === null,
      detail:
        refusDuPaiement ??
        (offre.paiement === "titres"
          ? "Les vendeurs reçoivent des actions nouvelles, à la valeur d'ouverture des vôtres."
          : "En numéraire : trésorerie, emprunt d'acquisition, apport d'investisseurs entrants."),
    },
    refusDuPaiement ?? undefined,
  );
  if (prix === null || !tourOk || refusDuPaiement) {
    return { cible, prix, criteres, motif: motifs[0] ?? null, chiffres: null };
  }

  const args = {
    cfg,
    actionsInitiales: vue.regles.actionsInitiales,
    maxDebtToEquity: o.maxDebtToEquity ?? undefined,
    prix,
    d: {
      prixMaximum: offre.prixMaximum,
      paiement: offre.paiement,
      ...(offre.emprunt !== undefined ? { emprunt: offre.emprunt } : {}),
      ...(offre.augmentationDeCapital !== undefined ? { augmentationDeCapital: offre.augmentationDeCapital } : {}),
    },
    acquereur: o.situation,
  };
  const c = chiffrerLeMontage(args);
  const verdict = jugerLeMontage(args);
  const A = o.situation;
  criteres.push({
    cle: "prix",
    libelle: "Prix maximum",
    ok: Number.isFinite(offre.prixMaximum) && prix <= offre.prixMaximum + 1e-6,
    detail: Number.isFinite(offre.prixMaximum)
      ? `Vous irez jusqu'à ${euros(offre.prixMaximum)} ; le vendeur demande ${euros(prix)}.`
      : "Fixez le prix au-delà duquel vous renoncez.",
  });
  const emet = c.titres > 0 || c.augmentation > 0;
  criteres.push({
    cle: "controle",
    libelle: "Contrôle",
    ok: (!emet || A.valeurParAction > 0) && c.partDesActionsDOrigine >= cfg.seuilDeControle - 1e-9,
    detail: !emet
      ? "Aucune action émise : vos associés gardent tout leur capital."
      : A.valeurParAction <= 0
        ? "Vos actions ne valent rien : personne n'en achète."
        : `Vos associés d'origine garderaient ${pourCent(c.partDesActionsDOrigine)} des actions ; il leur en faut au moins ${pourCent(cfg.seuilDeControle)}.`,
  });
  criteres.push({
    cle: "tresorerie",
    libelle: "Trésorerie",
    ok: c.numeraire <= Math.max(0, A.cash) + 0.005,
    detail: `Payé sur votre trésorerie : ${euros(c.numeraire)} ; vous disposez de ${euros(Math.max(0, A.cash))}.`,
  });
  if (c.emprunt > 0) {
    criteres.push({
      cle: "plafond",
      libelle: "Plafond de la banque",
      ok: c.plafondDeLaBanque === null || c.emprunt <= c.plafondDeLaBanque + 0.005,
      detail:
        c.plafondDeLaBanque === null
          ? `Emprunt d'acquisition : ${euros(c.emprunt)}.`
          : `Emprunt d'acquisition : ${euros(c.emprunt)} ; la banque prête jusqu'à ${euros(Math.max(0, c.plafondDeLaBanque))} pour ce rachat.`,
    });
  }
  criteres.push({
    cle: "decouvert",
    libelle: "Découvert",
    ok: c.tresorerieNetteApres >= -A.limiteDeDecouvert - 0.005,
    detail:
      c.tresorerieNetteApres >= 0
        ? `Après le paiement, trésorerie nette de ${euros(c.tresorerieNetteApres)}.`
        : `Après le paiement, découvert de ${euros(-c.tresorerieNetteApres)} ; la banque en autorise ${euros(A.limiteDeDecouvert)}.`,
  });
  return {
    cible,
    prix,
    criteres,
    // Une case vide n'est pas « sans limite » : le schéma la refuse à l'envoi.
    motif: !Number.isFinite(offre.prixMaximum)
      ? "Fixez le prix au-delà duquel vous renoncez."
      : "motif" in verdict
        ? verdict.motif
        : null,
    chiffres: c,
  };
}
