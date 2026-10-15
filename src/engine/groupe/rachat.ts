import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "../types";
import { conditionsBancaires, confianceServie } from "../finance/bank";
import { leFournisseur } from "./fournisseur";
import { laCibleEtrangere } from "./etranger";
import { laSociete, prixDeLaSociete } from "./societe";
import type {
  CibleDeRachat,
  ConfigDeGroupe,
  DecisionDeRachat,
  OperationDOuverture,
  PrixDeCession,
  ResultatDuRachat,
  ValeurDeLEntreprise,
} from "./types";

/**
 * RACHETER UNE CIBLE, AU JOUR 1 DU TOUR (niveau 7).
 *
 * Une décision de rachat par entreprise et par tour, quelle que soit la cible.
 * Chaque offre est d'abord jugée seule (tour, cible à vendre, prix maximum,
 * paiement, trésorerie, plafond de la banque, découvert, contrôle). Puis,
 * cible par cible, la plus haute offre recevable l'emporte, au prix demandé ;
 * deux plus hautes offres égales, et personne ne l'emporte. Les autres ne
 * paient rien et leur résultat dit pourquoi.
 *
 * Une cible est une société, rachetée par ses TITRES : un fournisseur
 * (`fournisseur.ts`) ou une entreprise étrangère (`etranger.ts`, en tout ou en
 * partie), payable en numéraire ou en actions de l'acquéreur (la fusion : ses
 * vendeurs reçoivent des actions à la valeur d'ouverture), et consolidée
 * ensuite (`consolidation.ts`).
 *
 * Un rachat refusé ne coûte rien et dit pourquoi. Pur : ce qu'une cible
 * réalise se tire sur son flux propre, jamais sur celui du tour.
 */

const actif = (c: CompanyState) => c.status !== "defaillant";

export const cleDeLaCible = (c: CibleDeRachat) => `${c.type}:${c.id}`;

/** Le nom d'une cible, ou rien si le scénario ne la vend pas. */
function nomDeLaCible(scenario: EngineScenarioConfig, c: CibleDeRachat | undefined): string | undefined {
  if (c?.type === "fournisseur") return leFournisseur(scenario, c.id)?.nom;
  if (c?.type === "etranger") return laCibleEtrangere(scenario, c.id)?.nom;
  return undefined;
}

/** Une cible déjà rachetée par une entreprise de la partie. */
export function dejaVendue(companies: readonly CompanyState[], c: CibleDeRachat): boolean {
  return companies.some((x) => (x.groupe?.filiales ?? []).some((f) => f.type === c.type && f.id === c.id));
}

export interface RachatsDuTour {
  companies: CompanyState[];
  operations: Record<string, OperationDOuverture>;
  rapports: Record<string, ResultatDuRachat>;
}

interface Offre {
  idA: string;
  cible: CibleDeRachat;
  nom: string;
  d: NonNullable<RoundDecisions["rachat"]>;
  prix: number;
  part: number;
  valeurs: PrixDeCession;
  titres: number;
  actionsEmises: number;
  emprunt: number;
  augmentation: number;
  numeraire: number;
}

function ajouter(ops: Record<string, OperationDOuverture>, id: string, o: OperationDOuverture) {
  const a = ops[id];
  ops[id] = a
    ? {
        flux: [...a.flux, ...o.flux],
        chargesDeRachat: a.chargesDeRachat + o.chargesDeRachat,
      }
    : o;
}

/**
 * Le paiement proposé, jugé sur le tour : une société ne se paie en actions
 * qu'à partir du tour où leur valeur reflète des résultats réels. `null` :
 * rien à redire.
 */
export function motifDuPaiement(
  cfg: NonNullable<ConfigDeGroupe["rachat"]>,
  roundIndex: number,
  paiement: DecisionDeRachat["paiement"],
): string | null {
  const tourMinTitres = cfg.tourMinTitres ?? cfg.tourMin;
  if (paiement === "titres" && roundIndex < tourMinTitres) {
    return `Un paiement en actions se décide à partir du tour ${tourMinTitres} : avant, la valeur de vos actions ne reflète pas encore de résultats réels.`;
  }
  return null;
}

/** Ce que le montage d'un rachat demande de connaître de l'acquéreur, à l'ouverture du tour. */
export interface SituationDeLAcquereur {
  cash: number;
  overdraft: number;
  equity: number;
  financialDebt: number;
  /** Actions en circulation. */
  actions: number;
  /** Valeur d'ouverture d'une action : le contrôle s'y juge, la fusion s'y émet. */
  valeurParAction: number;
  /** Le découvert que la banque autorise ce tour. */
  limiteDeDecouvert: number;
}

/** Le montage retenu : ce qui se paie en actions, par emprunt, par les investisseurs, en trésorerie. */
export interface MontageDuRachat {
  titres: number;
  actionsEmises: number;
  emprunt: number;
  augmentation: number;
  numeraire: number;
}

/** Les chiffres d'un montage, avant tout jugement : ce que la feuille montre, ce que le moteur juge. */
export interface ChiffresDuMontage extends MontageDuRachat {
  /** Part des actions que les associés d'origine garderaient (le contrôle). */
  partDesActionsDOrigine: number;
  /** Ce que la banque prête au plus pour ce rachat ; `null` sans plafond ou sans emprunt. */
  plafondDeLaBanque: number | null;
  /** Trésorerie nette du découvert après le rachat, au jour 1. */
  tresorerieNetteApres: number;
}

/** Ce que le montage d'un rachat donnerait, sans le juger. */
export function chiffrerLeMontage(args: {
  cfg: NonNullable<ConfigDeGroupe["rachat"]>;
  actionsInitiales: number;
  maxDebtToEquity: number | undefined;
  prix: number;
  d: Pick<DecisionDeRachat, "paiement" | "emprunt" | "augmentationDeCapital">;
  acquereur: SituationDeLAcquereur;
}): ChiffresDuMontage {
  const { cfg, prix, d, acquereur: A } = args;
  const titres = d.paiement === "titres" ? prix : 0;
  const emprunt = titres > 0 ? 0 : Math.max(0, d.emprunt ?? 0);
  const augmentation = titres > 0 ? 0 : Math.max(0, d.augmentationDeCapital ?? 0);
  const vA = A.valeurParAction;
  // Le contrôle se juge à la valeur d'ouverture : les actions remises aux
  // vendeurs (la fusion, émises à ce prix), et ce que les investisseurs
  // entrants détiendraient à ce prix, avec leur décote (leurs actions sont
  // émises à la clôture, au prix hors apport).
  const actionsEmises = titres > 0 && vA > 0 ? titres / vA : 0;
  const equivalent = actionsEmises + (augmentation > 0 && vA > 0 ? augmentation / (1 - cfg.decoteDEmission) / vA : 0);
  const ratioMax = args.maxDebtToEquity;
  return {
    titres,
    actionsEmises,
    emprunt,
    augmentation,
    numeraire: Math.max(0, prix - titres - emprunt - augmentation),
    partDesActionsDOrigine: args.actionsInitiales / (A.actions + equivalent),
    plafondDeLaBanque:
      ratioMax !== undefined && emprunt > 0 ? ratioMax * (A.equity + augmentation + titres) - A.financialDebt : null,
    tresorerieNetteApres: A.cash - A.overdraft + emprunt + augmentation - (prix - titres),
  };
}

/**
 * LE MONTAGE D'UN RACHAT, JUGÉ SEUL : prix maximum, valeur des actions,
 * contrôle, trésorerie, plafond de la banque, découvert. Le moteur le juge
 * ainsi au jour 1 ; la feuille de décision le juge de la même fonction avant
 * l'envoi, sur l'état d'ouverture, pour dire ce qui ne passerait pas.
 */
export function jugerLeMontage(args: Parameters<typeof chiffrerLeMontage>[0] & {
  d: Pick<DecisionDeRachat, "prixMaximum">;
}): MontageDuRachat | { motif: string } {
  const { cfg, prix, d, acquereur: A } = args;
  if (prix > d.prixMaximum + 1e-6) {
    return { motif: `Le vendeur demande ${Math.round(prix)} €, au-delà de votre prix maximum.` };
  }
  const c = chiffrerLeMontage(args);
  if ((c.titres > 0 || c.augmentation > 0) && A.valeurParAction <= 0) {
    return { motif: "Vos actions ne valent rien : personne n'en achète." };
  }
  if (c.partDesActionsDOrigine < cfg.seuilDeControle - 1e-9) {
    return { motif: "Vous émettriez tant d'actions que vous perdriez le contrôle de l'entreprise." };
  }
  if (c.numeraire > Math.max(0, A.cash) + 0.005) {
    return { motif: "Votre trésorerie ne couvre pas la part du prix que ni l'emprunt ni les investisseurs ne financent." };
  }
  if (c.plafondDeLaBanque !== null && c.emprunt > c.plafondDeLaBanque + 0.005) {
    return {
      motif: `La banque ne prête pas plus de ${Math.max(0, Math.round(c.plafondDeLaBanque))} € pour ce rachat : la dette dépasserait ${args.maxDebtToEquity} fois les capitaux propres.`,
    };
  }
  if (c.tresorerieNetteApres < -A.limiteDeDecouvert - 0.005) {
    return { motif: "Après le rachat, votre découvert dépasserait ce que la banque autorise : empruntez de quoi le couvrir." };
  }
  const { titres, actionsEmises, emprunt, augmentation, numeraire } = c;
  return { titres, actionsEmises, emprunt, augmentation, numeraire };
}

export function executerLesRachats(args: {
  scenario: EngineScenarioConfig;
  roundIndex: number;
  companies: CompanyState[];
  decisions: Record<string, RoundDecisions>;
  /** Valeur de chaque entreprise à l'ouverture (le contrôle se juge à ce prix). */
  ouverture: Map<string, ValeurDeLEntreprise>;
  /** La graine de la partie : chaque cible en dérive son flux propre. */
  graine: number;
}): RachatsDuTour {
  const { scenario, roundIndex } = args;
  const cfg = scenario.groupe?.rachat;
  const out: RachatsDuTour = { companies: args.companies, operations: {}, rapports: {} };
  if (!cfg) return out;
  const parId = new Map(args.companies.map((c) => [c.id, c]));
  const ids = args.companies.map((c) => c.id).sort((a, b) => a.localeCompare(b));
  const refuse = (idA: string, cible: CibleDeRachat, nom: string, motif: string) => {
    out.rapports[idA] = { statut: "refuse", motif, cible, nom };
  };

  // 1. Chaque offre, jugée seule.
  const offres: Offre[] = [];
  for (const idA of ids) {
    const d = args.decisions[idA]?.rachat;
    if (!d) continue;
    const A = parId.get(idA)!;
    const nomConnu = nomDeLaCible(scenario, d.cible);
    const nom = nomConnu ?? d.cible?.id ?? "";
    if (roundIndex < cfg.tourMin) {
      refuse(idA, d.cible, nom, `Un rachat se décide à partir du tour ${cfg.tourMin}.`);
      continue;
    }
    if (roundIndex >= scenario.roundsCount) {
      refuse(idA, d.cible, nom, "Un rachat au dernier tour ne se jugerait sur rien.");
      continue;
    }
    if (!actif(A) || !A.groupe) {
      refuse(idA, d.cible, nom, "Une entreprise en défaillance ne rachète pas.");
      continue;
    }
    if (nomConnu === undefined || dejaVendue(args.companies, d.cible)) {
      refuse(idA, d.cible, nom, "Cette cible n'est pas à vendre.");
      continue;
    }
    const refusDuPaiement = motifDuPaiement(cfg, roundIndex, d.paiement);
    if (refusDuPaiement) {
      refuse(idA, d.cible, nom, refusDuPaiement);
      continue;
    }
    // Une part d'entreprise étrangère : parmi celles qu'elle propose.
    const part = d.cible.type === "etranger" ? (d.part ?? 1) : 1;
    if (d.cible.type === "etranger" && !laCibleEtrangere(scenario, d.cible.id)!.parts.some((p) => Math.abs(p - part) < 1e-9)) {
      refuse(idA, d.cible, nom, "Cette part n'est pas à vendre.");
      continue;
    }
    const societe = laSociete(scenario, args.companies, args.graine, d.cible.type, d.cible.id, roundIndex - 1)!;
    const valeurs = prixDeLaSociete(scenario, societe, part);
    const prix = valeurs.prix;
    const bank = scenario.finance.bank;
    const limite = bank
      ? conditionsBancaires(
          confianceServie(A, scenario),
          { overdraftLimit: scenario.finance.overdraftLimit, overdraftAnnualRate: scenario.finance.overdraftAnnualRate },
          bank,
        ).overdraftLimit
      : scenario.finance.overdraftLimit;
    const montage = jugerLeMontage({
      cfg,
      actionsInitiales: scenario.groupe!.valorisation.actionsInitiales,
      maxDebtToEquity: scenario.finance.maxDebtToEquity,
      prix,
      d,
      acquereur: {
        cash: A.finance.cash,
        overdraft: A.finance.overdraft,
        equity: A.finance.equity,
        financialDebt: A.finance.financialDebt,
        actions: A.groupe.actions,
        valeurParAction: args.ouverture.get(A.id)?.valeurParAction ?? 0,
        limiteDeDecouvert: limite,
      },
    });
    if ("motif" in montage) {
      refuse(idA, d.cible, nom, montage.motif);
      continue;
    }
    const { titres, actionsEmises, emprunt, augmentation, numeraire } = montage;
    offres.push({ idA, cible: d.cible, nom, d, prix, part, valeurs, titres, actionsEmises, emprunt, augmentation, numeraire });
  }

  // 2. L'enchère : cible par cible, la plus haute offre l'emporte ; à égalité, personne.
  const gagnantes: Offre[] = [];
  const parCible = new Map<string, Offre[]>();
  for (const o of offres) parCible.set(cleDeLaCible(o.cible), [...(parCible.get(cleDeLaCible(o.cible)) ?? []), o]);
  for (const [, lot] of parCible) {
    const haute = Math.max(...lot.map((o) => o.d.prixMaximum));
    const enTete = lot.filter((o) => o.d.prixMaximum === haute);
    for (const o of lot) {
      if (enTete.length > 1 && o.d.prixMaximum === haute) {
        refuse(o.idA, o.cible, o.nom, "Deux acquéreurs ont fait la même offre : le vendeur n'a cédé à aucun.");
      } else if (o.d.prixMaximum < haute) {
        refuse(o.idA, o.cible, o.nom, "Un autre acquéreur a fait une meilleure offre.");
      }
    }
    if (enTete.length === 1) gagnantes.push(enTete[0]!);
  }

  // 3. Les rachats gagnants.
  const duree = scenario.finance.loanDurationRounds;
  for (const o of gagnantes) {
    const A = parId.get(o.idA)!;
    const frais = cfg.fraisDeTransaction * o.prix;
    const emprunts = [
      ...(A.loans ?? []),
      ...(o.emprunt > 0 && duree !== undefined ? [{ remaining: o.emprunt, perRound: o.emprunt / duree }] : []),
    ];
    const financement = {
      numeraire: o.numeraire,
      emprunt: o.emprunt,
      augmentation: o.augmentation,
      titres: o.titres,
      actionsEmises: o.actionsEmises,
    };
    const fluxDeFinancement = [
      ...(o.emprunt > 0 ? [{ label: "emprunt_d_acquisition", amount: o.emprunt }] : []),
      ...(o.augmentation > 0 ? [{ label: "augmentation_capital_investisseurs", amount: o.augmentation }] : []),
    ];
    // Un rachat de titres : les titres de participation au bilan de
    // l'acquéreur, la société consolidée à la clôture. Son historique d'EBE
    // s'ajoute à celui de l'acquéreur, tour par tour (pro forma).
    const type = o.cible.type;
    const soc = laSociete(scenario, args.companies, args.graine, type, o.cible.id, roundIndex - 1)!;
    const capitaux = soc.comptes[soc.comptes.length - 1]!.capitauxPropres;
    const cours = soc.cours[soc.cours.length - 1]!;
    // Intégration globale : tout son EBE entre au groupe, la part des autres en sort par la valeur.
    const ebeCible = soc.ebeEuros;
    const g = A.groupe!;
    const n = Math.max(g.ebe.length, ebeCible.length);
    const proForma = Array.from({ length: n }, (_, i) => (g.ebe[g.ebe.length - n + i] ?? 0) + (ebeCible[ebeCible.length - n + i] ?? 0));
    const net = A.finance.cash - A.finance.overdraft + o.emprunt + o.augmentation - (o.prix - o.titres);
    const ecart = o.prix - o.part * capitaux * cours;
    parId.set(A.id, {
      ...A,
      finance: {
        ...A.finance,
        fixedAssetsNet: A.finance.fixedAssetsNet + o.prix,
        financialDebt: A.finance.financialDebt + o.emprunt,
        equity: A.finance.equity + o.augmentation + o.titres,
        cash: Math.max(0, net),
        overdraft: Math.max(0, -net),
      },
      loans: emprunts,
      groupe: {
        ...g,
        actions: g.actions + o.actionsEmises,
        ebe: proForma,
        filiales: [
          ...g.filiales,
          {
            type,
            id: o.cible.id,
            nom: soc.nom,
            tour: roundIndex,
            part: o.part,
            prixPaye: o.prix,
            ecart,
            depreciation: 0,
            capitauxPropresDAcquisition: capitaux,
            coursDAcquisition: cours,
            clientsPartis: [],
            rationnes: [],
          },
        ],
      },
    });
    ajouter(out.operations, A.id, {
      flux: [...(o.prix - o.titres > 0 ? [{ label: "rachat_prix_paye", amount: -(o.prix - o.titres) }] : []), ...fluxDeFinancement],
      chargesDeRachat: frais,
    });
    out.rapports[A.id] = {
      statut: "conclu",
      cible: o.cible,
      nom: o.nom,
      prix: o.prix,
      paiement: o.titres > 0 ? "titres" : "numeraire",
      financement,
      frais,
      valeurs: o.valeurs,
      ecart,
    };
  }
  out.companies = args.companies.map((c) => parId.get(c.id)!);
  return out;
}
