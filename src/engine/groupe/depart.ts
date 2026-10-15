import type { CompanyState } from "../types";

/**
 * LA TAILLE DE DÉPART DU NIVEAU 7.
 *
 * Au niveau 7, chaque entreprise de la partie, équipes et concurrents
 * simulés, démarre plus grande que celle du scénario, dans la même
 * proportion pour toutes : ses lignes, son effectif, sa capacité, et le bilan
 * qui les porte (immobilisations, trésorerie, capitaux propres, emprunts),
 * multipliés par le même facteur. Un bilan équilibré multiplié reste
 * équilibré. La demande du marché, elle, ne bouge pas : l'entreprise y
 * démarre avec une capacité proche de la demande moyenne qu'elle reçoit, et
 * les pics la dépassent.
 *
 * Appliqué une fois, à la première ouverture (`simulerLeGroupe`), avant que
 * l'état de groupe ne fixe la valeur de départ. Le nombre de lignes de chaque
 * lot est arrondi ; leur valeur suit leur nombre.
 */
export function agrandir(state: CompanyState, facteur: number): CompanyState {
  if (facteur === 1) return state;
  const f = state.finance;
  const x = (n: number) => n * facteur;
  const { machineFleet: _parc, ...reste } = state;
  void _parc;
  return {
    ...reste,
    machineCapacity: x(state.machineCapacity),
    headcount: Math.round(x(state.headcount)),
    finishedGoods: { ...state.finishedGoods, quantity: x(state.finishedGoods.quantity) },
    ...(state.finishedGoodsByProduct
      ? {
          finishedGoodsByProduct: Object.fromEntries(
            Object.entries(state.finishedGoodsByProduct).map(([k, v]) => [k, { ...v, quantity: x(v.quantity) }]),
          ),
        }
      : {}),
    ...(state.fleet
      ? {
          fleet: state.fleet.map((l) => {
            const count = Math.round(x(l.count));
            return { ...l, count, bookValue: l.count > 0 ? (l.bookValue * count) / l.count : 0 };
          }),
        }
      : {}),
    ...(state.loans ? { loans: state.loans.map((l) => ({ ...l, remaining: x(l.remaining), perRound: x(l.perRound) })) } : {}),
    finance: {
      ...f,
      fixedAssetsNet: x(f.fixedAssetsNet),
      inventoryValue: x(f.inventoryValue),
      receivables: x(f.receivables),
      cash: x(f.cash),
      equity: x(f.equity),
      financialDebt: x(f.financialDebt),
      payables: x(f.payables),
      overdraft: x(f.overdraft),
      ...(f.vatLiability !== undefined ? { vatLiability: x(f.vatLiability) } : {}),
      ...(f.shortTermInvestment !== undefined ? { shortTermInvestment: x(f.shortTermInvestment) } : {}),
    },
  };
}

/**
 * LE FONDS DE ROULEMENT DE DÉPART : un apport des associés, en trésorerie, à
 * la création. Capitaux propres et disponibilités montent du même montant :
 * le bilan reste équilibré au centime. Il finance le stock que l'atelier
 * agrandi constitue avant les pics (voir `ConfigDeGroupe.depart.apport`).
 */
export function apporterLeFondsDeRoulement(state: CompanyState, apport: number): CompanyState {
  if (!(apport > 0)) return state;
  return {
    ...state,
    finance: { ...state.finance, cash: state.finance.cash + apport, equity: state.finance.equity + apport },
  };
}
