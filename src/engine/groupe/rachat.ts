import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "../types";
import { conditionsBancaires, confianceServie } from "../finance/bank";
import { etatDuSite, siteAcquis } from "./site-ferme";
import { chiffresDuFournisseur, comptesDuFournisseur, leFournisseur, prixDuFournisseur } from "./fournisseur";
import type {
  CibleDeRachat,
  OperationDOuverture,
  PrixDeCession,
  ResultatDeGroupe,
  ResultatDuRachat,
  SiteFerme,
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
 * L'audit se décide de même, au jour 1, un tour avant le rachat : il se paie
 * et révèle l'état réel de la cible.
 *
 * Deux sortes de cibles : un site à l'arrêt, racheté par ses ACTIFS
 * (`site-ferme.ts`), payé en numéraire ; une société, rachetée par ses TITRES
 * (un fournisseur, `fournisseur.ts`), payable aussi en actions de l'acquéreur
 * (la fusion : ses vendeurs reçoivent des actions à la valeur d'ouverture),
 * et consolidée ensuite (`consolidation.ts`).
 *
 * Un rachat ou un audit refusé ne coûte rien et dit pourquoi. Pur : l'état
 * caché d'une cible se tire sur son flux propre, jamais sur celui du tour.
 */

const actif = (c: CompanyState) => c.status !== "defaillant";

export const cleDeLaCible = (c: CibleDeRachat) => `${c.type}:${c.id}`;

/** Un site tel que le scénario le décrit, ou rien. */
function leSite(scenario: EngineScenarioConfig, c: CibleDeRachat | undefined): SiteFerme | undefined {
  return c?.type === "site_ferme" ? scenario.groupe?.sites?.find((s) => s.id === c.id) : undefined;
}

/** Le nom d'une cible, ou rien si le scénario ne la vend pas. */
function nomDeLaCible(scenario: EngineScenarioConfig, c: CibleDeRachat | undefined): string | undefined {
  if (c?.type === "site_ferme") return leSite(scenario, c)?.nom;
  if (c?.type === "fournisseur") return leFournisseur(scenario, c.id)?.nom;
  return undefined;
}

/** Une cible déjà rachetée par une entreprise de la partie. */
export function dejaVendue(companies: readonly CompanyState[], c: CibleDeRachat): boolean {
  return companies.some((x) =>
    c.type === "site_ferme"
      ? (x.groupe?.sites ?? []).some((s) => s.id === c.id)
      : (x.groupe?.filiales ?? []).some((f) => f.type === c.type && f.id === c.id),
  );
}

export interface RachatsDuTour {
  companies: CompanyState[];
  operations: Record<string, OperationDOuverture>;
  rapports: Record<string, ResultatDuRachat>;
  diligences: Record<string, NonNullable<ResultatDeGroupe["diligence"]>>;
}

interface Offre {
  idA: string;
  cible: CibleDeRachat;
  nom: string;
  d: NonNullable<RoundDecisions["rachat"]>;
  prix: number;
  valeurs?: PrixDeCession;
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
        depreciation: a.depreciation + o.depreciation,
      }
    : o;
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
  const out: RachatsDuTour = { companies: args.companies, operations: {}, rapports: {}, diligences: {} };
  if (!cfg) return out;
  const parId = new Map(args.companies.map((c) => [c.id, c]));
  const ids = args.companies.map((c) => c.id).sort((a, b) => a.localeCompare(b));
  const refuse = (idA: string, cible: CibleDeRachat, nom: string, motif: string) => {
    out.rapports[idA] = { statut: "refuse", motif, cible, nom };
  };

  // 0. Les audits : payés au jour 1, l'état réel dit au résultat. Un audit
  // demandé sur une cible vendue, inconnue, ou déjà auditée ne coûte rien.
  for (const id of ids) {
    const c = args.decisions[id]?.diligence;
    const A = parId.get(id)!;
    const site = leSite(scenario, c);
    if (!c || !site || !A.groupe || !actif(A)) continue;
    if (dejaVendue(args.companies, c) || roundIndex >= scenario.roundsCount) continue;
    const cle = cleDeLaCible(c);
    if (A.groupe.diligences.includes(cle)) continue;
    out.diligences[id] = { cible: c, nom: site.nom, cout: site.coutDeLAudit, etat: etatDuSite(site, args.graine) };
    ajouter(out.operations, id, { flux: [], chargesDeRachat: site.coutDeLAudit, depreciation: 0 });
    parId.set(id, { ...A, groupe: { ...A.groupe, diligences: [...A.groupe.diligences, cle] } });
  }

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
    if (d.paiement === "titres" && d.cible.type === "site_ferme") {
      refuse(idA, d.cible, nom, "Un liquidateur ne prend pas d'actions : un site se paie en numéraire.");
      continue;
    }
    const valeurs = d.cible.type === "fournisseur" ? prixDuFournisseur(scenario, args.companies, d.cible.id)! : undefined;
    const prix = valeurs ? valeurs.prix : leSite(scenario, d.cible)!.prix;
    if (prix > d.prixMaximum + 1e-6) {
      refuse(idA, d.cible, nom, `Le vendeur demande ${Math.round(prix)} €, au-delà de votre prix maximum.`);
      continue;
    }
    const titres = d.paiement === "titres" ? prix : 0;
    const emprunt = titres > 0 ? 0 : Math.max(0, d.emprunt ?? 0);
    const augmentation = titres > 0 ? 0 : Math.max(0, d.augmentationDeCapital ?? 0);
    const vA = args.ouverture.get(A.id)?.valeurParAction ?? 0;
    if ((titres > 0 || augmentation > 0) && vA <= 0) {
      refuse(idA, d.cible, nom, "Vos actions ne valent rien : personne n'en achète.");
      continue;
    }
    // Le contrôle se juge à la valeur d'ouverture : les actions remises aux
    // vendeurs (la fusion, émises à ce prix), et ce que les investisseurs
    // entrants détiendraient à ce prix, avec leur décote (leurs actions sont
    // émises à la clôture, au prix hors apport).
    const actionsEmises = titres > 0 ? titres / vA : 0;
    const equivalent = actionsEmises + (augmentation > 0 ? augmentation / (1 - cfg.decoteDEmission) / vA : 0);
    const actionsInitiales = scenario.groupe!.valorisation.actionsInitiales;
    if (actionsInitiales / (A.groupe.actions + equivalent) < cfg.seuilDeControle - 1e-9) {
      refuse(idA, d.cible, nom, "Vous émettriez tant d'actions que vous perdriez le contrôle de l'entreprise.");
      continue;
    }
    const numeraire = Math.max(0, prix - titres - emprunt - augmentation);
    if (numeraire > Math.max(0, A.finance.cash) + 0.005) {
      refuse(idA, d.cible, nom, "Votre trésorerie ne couvre pas la part du prix que ni l'emprunt ni les investisseurs ne financent.");
      continue;
    }
    const ratioMax = scenario.finance.maxDebtToEquity;
    if (ratioMax !== undefined && emprunt > 0) {
      const plafond = ratioMax * (A.finance.equity + augmentation + titres) - A.finance.financialDebt;
      if (emprunt > plafond + 0.005) {
        refuse(
          idA,
          d.cible,
          nom,
          `La banque ne prête pas plus de ${Math.max(0, Math.round(plafond))} € pour ce rachat : la dette dépasserait ${ratioMax} fois les capitaux propres.`,
        );
        continue;
      }
    }
    const bank = scenario.finance.bank;
    const limite = bank
      ? conditionsBancaires(
          confianceServie(A, scenario),
          { overdraftLimit: scenario.finance.overdraftLimit, overdraftAnnualRate: scenario.finance.overdraftAnnualRate },
          bank,
        ).overdraftLimit
      : scenario.finance.overdraftLimit;
    const netApres = A.finance.cash - A.finance.overdraft + emprunt + augmentation - (prix - titres);
    if (netApres < -limite - 0.005) {
      refuse(idA, d.cible, nom, "Après le rachat, votre découvert dépasserait ce que la banque autorise : empruntez de quoi le couvrir.");
      continue;
    }
    offres.push({ idA, cible: d.cible, nom, d, prix, ...(valeurs ? { valeurs } : {}), titres, actionsEmises, emprunt, augmentation, numeraire });
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
    if (o.cible.type === "site_ferme") {
      // Un rachat d'actifs, au bilan de l'acquéreur.
      const site = leSite(scenario, o.cible)!;
      const etat = etatDuSite(site, args.graine);
      const acquis = siteAcquis(site, etat, scenario, roundIndex);
      const cout = o.prix + etat.remiseEnEtat;
      const net = A.finance.cash - A.finance.overdraft + o.emprunt + o.augmentation - cout;
      parId.set(A.id, {
        ...A,
        finance: {
          ...A.finance,
          fixedAssetsNet: A.finance.fixedAssetsNet + cout,
          financialDebt: A.finance.financialDebt + o.emprunt,
          equity: A.finance.equity + o.augmentation,
          cash: Math.max(0, net),
          overdraft: Math.max(0, -net),
        },
        loans: emprunts,
        groupe: { ...A.groupe!, sites: [...A.groupe!.sites, acquis] },
      });
      ajouter(out.operations, A.id, {
        flux: [
          { label: "rachat_prix_paye", amount: -o.prix },
          ...(etat.remiseEnEtat > 0 ? [{ label: "remise_en_etat_du_site", amount: -etat.remiseEnEtat }] : []),
          ...fluxDeFinancement,
        ],
        chargesDeRachat: frais + etat.passifEnvironnemental,
        depreciation: acquis.depreciation,
      });
      const miseEnRoute = new Map<number, number>();
      for (const l of acquis.enAttente) miseEnRoute.set(l.tour, (miseEnRoute.get(l.tour) ?? 0) + l.count);
      out.rapports[A.id] = {
        statut: "conclu",
        cible: o.cible,
        nom: o.nom,
        prix: o.prix,
        paiement: "numeraire",
        financement,
        frais,
        site: {
          etat,
          valeurInscrite: acquis.valeurInscrite,
          depreciation: acquis.depreciation,
          miseEnRoute: [...miseEnRoute].map(([tour, lignes]) => ({ tour, lignes })),
        },
      };
      continue;
    }
    // Un rachat de titres : les titres de participation au bilan de
    // l'acquéreur, la société consolidée à la clôture. Son historique d'EBE
    // s'ajoute à celui de l'acquéreur, tour par tour (pro forma).
    const f = leFournisseur(scenario, o.cible.id)!;
    const comptes = comptesDuFournisseur(f, chiffresDuFournisseur(args.companies, f.code), scenario.finance.taxRate);
    const capitaux = comptes[comptes.length - 1]!.capitauxPropres;
    const ebeCible = comptes.slice(1).map((c) => c.ebe);
    const g = A.groupe!;
    const n = Math.max(g.ebe.length, ebeCible.length);
    const proForma = Array.from({ length: n }, (_, i) => (g.ebe[g.ebe.length - n + i] ?? 0) + (ebeCible[ebeCible.length - n + i] ?? 0));
    const net = A.finance.cash - A.finance.overdraft + o.emprunt + o.augmentation - (o.prix - o.titres);
    const ecart = o.prix - capitaux;
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
            type: "fournisseur",
            id: f.code,
            nom: f.nom,
            tour: roundIndex,
            part: 1,
            prixPaye: o.prix,
            ecart,
            depreciation: 0,
            capitauxPropresDAcquisition: capitaux,
            clientsPartis: [],
            rationnes: [],
          },
        ],
      },
    });
    ajouter(out.operations, A.id, {
      flux: [...(o.prix - o.titres > 0 ? [{ label: "rachat_prix_paye", amount: -(o.prix - o.titres) }] : []), ...fluxDeFinancement],
      chargesDeRachat: frais,
      depreciation: 0,
    });
    out.rapports[A.id] = {
      statut: "conclu",
      cible: o.cible,
      nom: o.nom,
      prix: o.prix,
      paiement: o.titres > 0 ? "titres" : "numeraire",
      financement,
      frais,
      ...(o.valeurs ? { valeurs: o.valeurs } : {}),
      ecart,
    };
  }
  out.companies = args.companies.map((c) => parId.get(c.id)!);
  return out;
}
