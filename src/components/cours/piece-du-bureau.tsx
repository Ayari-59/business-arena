import type { NatureDePiece, PieceDuBureau } from "@/config/cours/bureaux/types";
import { montantInsecable } from "@/pedagogy/cours/aides-du-guide";
import { montantEcrit } from "@/pedagogy/cours/correcteur";

/**
 * UNE PIÈCE DE LA PILE, TELLE QU'ELLE ARRIVE SUR LE BUREAU (config/cours/bureaux/types.ts) : un courriel,
 * un relevé de banque, un extrait de compte, un talon de chèque, un avis, une lettre ; et pour une enquête
 * (config/cours/enquetes), une balance, une note, une écriture du journal.
 *
 * LISIBLE SUR TÉLÉPHONE : aucune pièce n'a plus de deux colonnes. Une opération se lit sur une ligne, sa
 * date et son libellé à gauche, son montant à droite, suivi de son sens (débit ou crédit) ; le sens se lit
 * du côté de celui qui tient le document : au relevé, la banque débite ce qui sort ; au compte 512, la
 * boutique débite ce qui entre ; au plan de trésorerie, l'entreprise lit ses entrées et ses sorties. Une
 * balance ou une écriture se lit de même, compte par compte : le numéro et l'intitulé à gauche, le montant
 * et son côté à droite. La pièce ne dit jamais ce qu'il faut en faire.
 */

const montant = (x: number) => montantInsecable(montantEcrit(Math.abs(x)));

/** Le nom de la nature, en surtitre de la pièce. */
const NATURES: Readonly<Record<NatureDePiece, string>> = {
  courriel: "Courriel",
  releve: "Relevé de banque",
  extrait: "Extrait de compte",
  talon: "Talon de chèque",
  avis: "Avis",
  lettre: "Lettre",
  balance: "Balance",
  note: "Note",
  ecriture: "Écriture du journal",
  plan: "Plan de trésorerie",
  facture: "Facture",
  "bon-de-commande": "Bon de commande",
  "bon-de-livraison": "Bon de livraison",
  bordereau: "Bordereau",
  bon: "Bon",
  fiche: "Fiche",
  contrat: "Contrat",
  "proces-verbal": "Procès-verbal",
};

/** Le sens d'une opération, vu de celui qui tient le document (débit négatif : ce qui sort). */
function sens(nature: NatureDePiece, x: number) {
  const sort = x < 0;
  // Un plan de trésorerie parle en entrées et en sorties, du côté de l'entreprise.
  if (nature === "plan") return sort ? "sortie" : "entrée";
  if (nature === "extrait") return sort ? "crédit" : "débit";
  return sort ? "débit" : "crédit";
}

export function PieceDeLaPile({ piece }: { piece: PieceDuBureau }) {
  const p = piece;
  return (
    <article className="papier grid min-w-0 gap-3 rounded-lg p-4 text-sm" aria-label={p.titre} data-piece={p.code} data-nature={p.nature}>
      <header className="grid gap-1 border-b border-slate-300 pb-2">
        <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-xs font-semibold uppercase tracking-etiquette">{NATURES[p.nature]}</span>
          <span className="text-slate-400">{p.date}</span>
        </p>
        <p className="font-semibold">{p.titre}</p>
        <p className="grid gap-0.5">
          <span>
            <span className="text-slate-400">De : </span>
            {p.de}
          </span>
          <span>
            <span className="text-slate-400">À : </span>
            {p.a}
          </span>
          {p.objet && (
            <span>
              <span className="text-slate-400">Objet : </span>
              {p.objet}
            </span>
          )}
        </p>
      </header>
      {p.paragraphes?.length ? (
        <div className="grid gap-2 leading-relaxed">
          {p.paragraphes.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
      ) : null}
      {p.lignes?.length ? (
        <ul className="grid divide-y divide-slate-200" aria-label="Les opérations">
          {p.lignes.map((l, i) => (
            <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 py-1.5" data-ligne-de-piece="">
              <span className="min-w-0">
                <span className="block text-xs text-slate-400">{l.date}</span>
                <span className="hyphens-auto">{l.libelle}</span>
              </span>
              <span className="self-end whitespace-nowrap text-right tabular-nums">
                {montant(l.montant)}
                <span className="ml-1 inline-block w-11 text-left text-xs text-slate-400">{sens(p.nature, l.montant)}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {p.comptes?.length ? (
        <ul className="grid divide-y divide-slate-200" aria-label="Les comptes">
          {p.comptes.map((l, i) => (
            <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 py-1.5" data-compte-de-piece={l.compte}>
              <span className="min-w-0">
                <span className="block font-semibold tabular-nums">{l.compte}</span>
                <span className="hyphens-auto text-xs">{l.intitule}</span>
              </span>
              <span className="self-end whitespace-nowrap text-right tabular-nums">
                {montant(l.debit || l.credit)}
                <span className="ml-1 inline-block w-11 text-left text-xs text-slate-400">{l.debit ? "débit" : "crédit"}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {p.montants?.length ? (
        <dl className="grid gap-1 border-t border-slate-300 pt-2">
          {p.montants.map((x) => (
            <div key={x.libelle} className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 ${x.fort ? "font-semibold" : ""}`}>
              <dt className="min-w-0">{x.libelle}</dt>
              <dd className="whitespace-nowrap text-right tabular-nums">{montant(x.montant)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {p.mention && <p className="text-xs text-slate-400">{p.mention}</p>}
    </article>
  );
}
