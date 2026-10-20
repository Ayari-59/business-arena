import type { RoundDecisions } from "../types";

/**
 * UN MARCHÉ ÉQUITABLE : CHACUN DÉCIDE AVEC LES LEVIERS DU NIVEAU.
 *
 * Le joueur ne voit à l'écran que les leviers que son niveau ouvre ; les autres
 * partent avec la valeur de la gestion neutre du secteur (le champ caché, même
 * là où la qualité proposée à l'écran en diffère), ou ne partent pas. Les concurrents pilotés, l'équipe absente et la gestion de
 * référence de « mérite ou chance » décidaient, eux, avec tout : un bot
 * « premium » soignait sa qualité au niveau 1, où le joueur ne le peut pas.
 *
 * Cette fonction ramène une décision aux leviers ouverts, AU MÊME DÉFAUT QUE
 * CELUI QUE LE FORMULAIRE ENVOIE pour un levier fermé :
 *
 *   qualité, maintenance   la valeur neutre (`neutre`), celle du champ caché ;
 *   RH, investissement,
 *   RSE, créances          rien (le formulaire n'envoie pas ces blocs) ;
 *   placement              zéro, dans un bloc de trésorerie qui reste ;
 *   financement            zéro emprunt, zéro remboursement anticipé, zéro apport ;
 *   dividende              zéro ;
 *   assurance              aucune ;
 *   R&D                    rien (le snapshot d'un niveau qui la ferme n'en a pas) ;
 *   rachat, audit,
 *   sous-traitance         rien (niveau 7 seulement).
 *
 * Pur, sans la configuration des niveaux : il reçoit les drapeaux.
 */
export interface LeviersOuverts {
  quality: boolean;
  maintenance: boolean;
  finance: boolean;
  creances: boolean;
  insurance: boolean;
  hr: boolean;
  investment: boolean;
  rse: boolean;
  placement: boolean;
  dividend: boolean;
  rd: boolean;
  /** Niveau 7 : racheter une cible (fournisseur, entreprise étrangère) et employer ses synergies. Absent : fermé. */
  croissanceExterne?: boolean;
  /** Niveau 7 : faire fabriquer par un sous-traitant. Absent : fermé. */
  externalisation?: boolean;
}

export function aLaMesureDuNiveau(
  d: RoundDecisions,
  ouverts: LeviersOuverts | null | undefined,
  /** La décision neutre du même tour : ce que porte un champ caché. Absente : `d`. */
  neutre: RoundDecisions = d,
): RoundDecisions {
  if (!ouverts) return d;
  const out: RoundDecisions = { ...d };
  if (!ouverts.quality) out.qualityBudget = neutre.qualityBudget;
  if (!ouverts.maintenance) out.maintenanceBudget = neutre.maintenanceBudget;
  if (!ouverts.hr) delete out.hr;
  if (!ouverts.insurance) out.insurance = false;
  if (!ouverts.investment) delete out.investment;
  if (!ouverts.rse) delete out.rse;
  if (!ouverts.rd) delete out.rdBudget;
  if (!ouverts.croissanceExterne) {
    delete out.rachat;
    delete out.reseauEtranger;
    delete out.fabricationEtrangere;
  }
  if (!ouverts.externalisation) delete out.sousTraitance;
  if (!ouverts.creances) delete out.treasury;
  else if (!ouverts.placement && out.treasury) out.treasury = { ...out.treasury, placement: 0 };
  if (!ouverts.finance || !ouverts.dividend) {
    out.finance = {
      ...(out.finance ?? {}),
      ...(ouverts.finance ? {} : { newLoan: 0, loanRepayment: 0, capitalIncrease: 0 }),
      ...(ouverts.dividend ? {} : { dividend: 0 }),
    };
  }
  if (out.products) {
    out.products = Object.fromEntries(
      Object.entries(out.products).map(([code, p]) => {
        const q = { ...p };
        if (!ouverts.quality) {
          const neutreQ = neutre.products?.[code]?.qualityBudget;
          if (neutreQ !== undefined) q.qualityBudget = neutreQ;
          else delete q.qualityBudget;
        }
        if (!ouverts.rd) delete q.rdBudget;
        return [code, q];
      }),
    );
  }
  return out;
}
