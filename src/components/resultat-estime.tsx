"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { decisionsSaisies } from "@/config/decisions-saisies";
import { ventesEstimeesParReference } from "@/config/ventes-estimees";
import { estimerLeTour, type DossierDEstimation, type ResultatEstime } from "@/engine/estimation";
import { lignesDuCompte } from "@/components/lecture-des-comptes";
import { Chevron, Repliable } from "@/components/repliable";
import { ChiffreQuiArrive, ValeurRafraichie } from "@/components/chiffre-qui-arrive";
import { dureeDuJeton } from "@/lib/mouvement";
import { formatEuro, formatUnits } from "@/lib/format";
import { Icone } from "@/components/icone";
import type { EstimationEnCours } from "@/lib/estimation-en-cours";
import type { ScenarioVocabulary } from "@/config/scenarios/registry";

/**
 * « VOUS DÉCIDEZ » : CE QUE VOS DÉCISIONS DONNERAIENT, PENDANT QUE VOUS DÉCIDEZ.
 *
 * La moitié du slogan manquait à l'écran. L'équipe fixait un prix, un volume,
 * des budgets, et ne découvrait le compte qu'après la clôture — la seule
 * prévision disponible était un classeur à télécharger. Elle dit maintenant ce
 * qu'elle CROIT vendre, et le compte que ces ventes donneraient se recalcule
 * sous ses yeux, à la frappe.
 *
 * UNE ESTIMATION N'EST PAS UN RÉSULTAT, et la charte le dit : les chiffres
 * d'ici sont à l'encre, ou en bleu donnée. Jamais de vert ni de rouge francs —
 * ils sont au RÉSULTAT, celui que le marché rendra. Jamais d'orange — il est à
 * l'action. Une trésorerie estimée négative se signale par le TEXTE et une
 * pastille neutre, pas par une couleur de verdict : ce n'est pas encore arrivé.
 *
 * LE CALCUL EST CELUI DU MOTEUR, DANS LE NAVIGATEUR. `estimerLeTour` appelle
 * `simulateRound` avec la demande imposée ; le dossier préparé par le serveur
 * est expurgé des paramètres de marché et ne porte aucune graine (voir
 * `services/game-view.service.ts`). Rien ne part au serveur pour estimer : pas
 * d'aller-retour, pas d'attente, et rien à révéler.
 *
 * LE MOUVEMENT EST CELUI DU LOT 5B. Un chiffre qui se recalcule à chaque touche
 * ne défile pas : il reçoit l'éclat bref de `ValeurRafraichie`, celui du total
 * des budgets. Le calcul est posé derrière un anti-rebond (`--duree-saisie`),
 * et l'annonce aux lecteurs d'écran est une seule phrase courte, polie.
 */

/** Ce que l'encart lit du formulaire, recalculé derrière un anti-rebond. */
export function useResultatEstime(
  dossier: DossierDEstimation | null,
  formRef: RefObject<HTMLFormElement | null>,
): { estime: ResultatEstime | null; relire: () => void } {
  const [estime, setEstime] = useState<ResultatEstime | null>(null);
  const minuteur = useRef<number | null>(null);

  const calculer = useCallback(() => {
    const form = formRef.current;
    if (!form || !dossier) return;
    const donnees = new FormData(form);
    const ventes = ventesEstimeesParReference(donnees.entries());
    if (!ventes) {
      setEstime(null);
      return;
    }
    const { decisions, volume } = decisionsSaisies(donnees);
    // Un champ vidé pendant la frappe (« 4 », effacé, puis « 42 ») : on garde
    // le dernier compte juste plutôt que d'afficher un tour sans prix.
    if (!Number.isFinite(volume) || !Number.isFinite(decisions.price)) return;
    try {
      setEstime(estimerLeTour(dossier, decisions, ventes));
    } catch {
      // Le moteur refuse une décision impossible (un bilan qui ne s'équilibre
      // pas sur une saisie à moitié tapée) : on n'affiche rien plutôt qu'un
      // chiffre faux.
      setEstime(null);
    }
  }, [dossier, formRef]);

  const relire = useCallback(() => {
    if (minuteur.current !== null) window.clearTimeout(minuteur.current);
    const delai = dureeDuJeton("--duree-saisie");
    if (delai <= 0) {
      calculer();
      return;
    }
    minuteur.current = window.setTimeout(() => {
      minuteur.current = null;
      calculer();
    }, delai);
  }, [calculer]);

  // Premier calcul après le montage : le serveur n'a pas de formulaire à lire.
  useEffect(() => {
    calculer();
    return () => {
      if (minuteur.current !== null) window.clearTimeout(minuteur.current);
    };
  }, [calculer]);

  return { estime, relire };
}

/** Le libellé, le même partout : une estimation dit d'où elle vient. */
export const TITRE_ESTIME = "Résultat estimé";
export const SOUS_TITRE_ESTIME = "selon vos ventes estimées";

/**
 * L'aide courte sous le champ : ce que le tour passé a vendu, et ce qui a
 * manqué. Rien au premier tour — il n'y a aucun repère à rappeler, et un zéro
 * s'y lirait comme un fait.
 */
export function aideDesVentesEstimees(
  repere: { tour: number; vendu: number; manque: number } | undefined,
  v: Pick<ScenarioVocabulary, "units" | "unitsGender">,
): string | undefined {
  if (!repere) return undefined;
  // On ne vend pas « des enceintes vendus » : le genre de l'unité est au
  // registre du secteur, et c'est lui qui accorde.
  const accord = `${v.unitsGender === "f" ? "e" : ""}${repere.vendu > 1 ? "s" : ""}`;
  const vendu = `Tour ${repere.tour} : ${formatUnits(repere.vendu)} ${v.units} vendu${accord}`;
  return repere.manque >= 1
    ? `${vendu}, ${formatUnits(repere.manque)} de demande non servie`
    : `${vendu}, rien n'a manqué`;
}

/**
 * LE RÉSUMÉ DE L'ESTIMATION, EN NOMBRES : ce que la barre du téléphone lit
 * (`lib/estimation-en-cours.ts`). Sans vente estimée, il est « vide » : la
 * barre invite à estimer au lieu d'écrire des zéros.
 */
export function resumeDeLEstimation(
  estime: ResultatEstime | null,
  unites: string,
): EstimationEnCours | null {
  if (!estime) return null;
  return {
    vide: estime.ventesEstimees <= 0,
    resultatNet: estime.resultatNet,
    tresorerieNette: estime.tresorerieNette,
    chiffreDAffaires: estime.chiffreDAffaires,
    stockFinal: estime.stockFinal.unites,
    unites,
    manquantes: estime.manquantes,
    ventesLivrables: estime.ventesLivrables,
  };
}

/** L'invitation, quand rien n'est encore estimé : la même phrase partout. */
export const INVITATION_A_ESTIMER = "Estimez vos ventes pour voir le résultat";

/**
 * UNE VALEUR DE L'ENCART : UN GRAND CHIFFRE QUI VIT (lot 6E).
 *
 * Ce sont les chiffres qui bougent pendant qu'on décide, et ils étaient en
 * 16 px : on réglait un prix sans voir le résultat bouger. Ils passent en
 * grands chiffres condensés (`.chiffre-estime`), avec la lueur NEUTRE du
 * cockpit (`.chiffre-cle`), et réagissent à chaque saisie dans la grammaire du
 * lot 5B : le chiffre MONTE ou DESCEND de l'ancienne valeur à la nouvelle
 * (`ChiffreQuiArrive`, durée `--duree-chiffre`), et l'anneau bref du recalcul
 * le signale (`ValeurRafraichie`). Le premier rendu ne bouge pas : rien n'a
 * encore changé. Toujours à l'encre : une estimation n'est pas un résultat.
 */
function Chiffre({
  titre,
  valeur,
  ecrire,
  unite,
  alerte = false,
  className = "",
  marque,
}: {
  titre: string;
  valeur: number;
  ecrire: (n: number) => string;
  /** L'unité posée après le chiffre, en petit (le stock en unités du métier). */
  unite?: string;
  /** Un chiffre qui demande à être lu (une trésorerie sous zéro) : il le dit en toutes lettres. */
  alerte?: boolean;
  className?: string;
  /** Le repère du résultat net, que l'e2e du lot P7 cherche dans la fenêtre. */
  marque?: boolean;
}) {
  const texte = ecrire(valeur);
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="libelle text-slate-300">{titre}</dt>
      <dd
        className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-slate-50"
        {...(marque ? { "data-resultat-net-estime": "" } : {})}
      >
        <ValeurRafraichie valeur={texte} className="chiffre-cle">
          <ChiffreQuiArrive valeur={valeur} format={ecrire} className="chiffre-estime" />
          {unite ? (
            <>
              {" "}
              <span className="text-base font-medium text-slate-300">{unite}</span>
            </>
          ) : null}
        </ValeurRafraichie>
        {alerte ? (
          <span className="pastille-etat rounded-full px-2 py-0.5 text-xs font-medium text-slate-100">
            sous zéro
          </span>
        ) : null}
      </dd>
    </div>
  );
}

/**
 * L'ANNONCE, UNE SEULE PHRASE, POLIE. Les chiffres ne sont pas dans une région
 * vivante : relus à chaque touche, ils bavarderaient. Une phrase courte
 * suffit, et l'anti-rebond en limite le débit. Un seul exemplaire par écran :
 * le cadran sur ordinateur, la ligne de la barre sur téléphone (l'un et
 * l'autre ne sont jamais rendus ensemble).
 */
function AnnonceEstimee({ resume }: { resume: EstimationEnCours | null }) {
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {!resume
        ? ""
        : resume.vide
          ? `${INVITATION_A_ESTIMER}.`
          : `Résultat net estimé ${formatEuro(resume.resultatNet)}, trésorerie estimée ${formatEuro(
              resume.tresorerieNette,
            )}.`}
    </p>
  );
}

/**
 * LE CADRAN DU RÉSULTAT ESTIMÉ, EN TÊTE DE LA FEUILLE DE DÉCISION (lot P7).
 *
 * « Je ne vois pas le résultat estimé. » Il existait, au-dessus des étapes,
 * en panneau d'information plat : il partait avec le défilement dès la
 * première étape et ne se voyait plus aux étapes 2 à 7, ni au moment de
 * valider. Il devient le CADRAN DU COCKPIT (lot 6E) : un bandeau COLLANT
 * (`.cadran-estime`, sous la barre du site et l'ardoise repliée), relevé, la
 * lumière d'un pixel et l'arête de la teinte du métier, qui garde sous les
 * yeux, à chaque étape et jusqu'à « Valider et simuler », le RÉSULTAT NET et
 * la TRÉSORERIE de fin de tour en grands chiffres condensés (et le chiffre
 * d'affaires quand la largeur le permet). Le détail (stock final, alertes,
 * compte ligne à ligne) reste derrière son repli, dans le cadran.
 *
 * UNE SEULE ARÊTE PAR ÉCRAN (règle P3, déplacée) : le cadran est sur toutes
 * les étapes, c'est lui qui la porte ; les panneaux de décision gardent leur
 * relief sans arête quand il est là (globals.css, « LOT P7 »).
 *
 * Tant que les ventes estimées valent zéro, pas de zéros : une invitation, et
 * le lien qui mène au champ.
 */
export function EncartResultatEstime({
  estime,
  vocabulary: v,
  /** Le lien du cockpit de prévision, laissé à sa place : il reste. */
  cockpit = null,
  /** Mène au champ des ventes estimées (son étape, puis le focus). */
  allerAuChamp,
}: {
  estime: ResultatEstime | null;
  vocabulary: ScenarioVocabulary;
  cockpit?: React.ReactNode;
  allerAuChamp?: () => void;
}) {
  const cadran = useRef<HTMLElement>(null);
  // LA HAUTEUR DU CADRAN, publiée sur la feuille : un champ qui prend le focus
  // au clavier s'arrête SOUS le cadran collant (`scroll-margin-top`), au lieu
  // de passer dessous.
  useEffect(() => {
    const el = cadran.current;
    const feuille = el?.parentElement;
    if (!el || !feuille || typeof ResizeObserver === "undefined") return;
    const poser = () =>
      feuille.style.setProperty("--hauteur-du-cadran", `${Math.round(el.offsetHeight)}px`);
    poser();
    const veille = new ResizeObserver(poser);
    veille.observe(el);
    return () => veille.disconnect();
  }, []);

  const resume = resumeDeLEstimation(estime, v.units);
  const vide = !estime || estime.ventesEstimees <= 0;
  const manque = !vide && estime.manquantes >= 1;
  const tresorerieNegative = !vide && estime.tresorerieNette < 0;
  const alertes = (manque ? 1 : 0) + (tresorerieNegative ? 1 : 0);
  return (
    <section
      ref={cadran}
      data-resultat-estime
      aria-label={`${TITRE_ESTIME} · ${SOUS_TITRE_ESTIME}`}
      // LE CADRAN DU COCKPIT (lot P7) : ni panneau d'information plat, ni
      // panneau de décision. Collant, relevé, l'arête du métier.
      className="cadran-estime"
    >
      <div className="cadran-bande flex flex-wrap items-center gap-x-6 gap-y-1.5">
        <p className="flex shrink-0 items-center gap-2">
          <Icone
            nom="resultats"
            className="h-5 w-5 text-[color:var(--metier,var(--color-slate-300))]"
          />
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-slate-50">{TITRE_ESTIME}</span>
            <span className="block text-xs text-slate-300">{SOUS_TITRE_ESTIME}</span>
          </span>
        </p>
        {vide ? (
          // Le premier rendu (avant le premier calcul) garde la place du chiffre :
          // le cadran ne saute pas d'une ligne quand le compte arrive.
          estime ? (
            <p data-estime-vide="" className="text-sm text-slate-100">
              {INVITATION_A_ESTIMER}.{" "}
              <a
                // Sans script, l'ancre mène au moins à la feuille.
                href="#decisions"
                onClick={(e) => {
                  if (!allerAuChamp) return;
                  e.preventDefault();
                  allerAuChamp();
                }}
                className="font-medium text-slate-50 underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                Saisir vos ventes estimées
              </a>
            </p>
          ) : (
            <span aria-hidden className="chiffre-estime text-slate-400">
              …
            </span>
          )
        ) : (
          <dl className="flex min-w-0 flex-wrap items-end gap-x-8 gap-y-1">
            <Chiffre titre="Résultat net" valeur={estime.resultatNet} ecrire={formatEuro} marque />
            <Chiffre
              titre="Trésorerie fin de tour"
              valeur={estime.tresorerieNette}
              ecrire={formatEuro}
              alerte={tresorerieNegative}
            />
            {/* Le chiffre d'affaires, si la place le permet. */}
            <Chiffre
              titre="Chiffre d'affaires"
              valeur={estime.chiffreDAffaires}
              ecrire={formatEuro}
              className="max-xl:hidden"
            />
          </dl>
        )}
      </div>
      {vide ? null : (
        // LE DÉTAIL : stock final, alertes, compte ligne à ligne. Son résumé
        // se pose au bout du bandeau sur grand écran (globals.css, « LOT P7 »),
        // et le repli s'ouvre DANS le cadran, sous le bandeau.
        <Repliable
          resume="Compte de résultat estimé"
          quoi={
            alertes > 0
              ? `${alertes} alerte${alertes > 1 ? "s" : ""}`
              : `stock final ${formatUnits(estime.stockFinal.unites)} ${v.units}`
          }
          className="cadran-detail"
        >
          <div className="cadran-tiroir mt-2 space-y-3 pb-1">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
              <Chiffre
                titre="Stock final"
                valeur={estime.stockFinal.unites}
                ecrire={formatUnits}
                unite={v.units}
              />
              <Chiffre
                titre="Chiffre d'affaires"
                valeur={estime.chiffreDAffaires}
                ecrire={formatEuro}
                className="xl:hidden"
              />
            </dl>
            {/*
              LES DEUX ALERTES QUI CHANGENT UNE DÉCISION : une estimation qu'on ne
              pourra pas livrer, et une caisse qui passe sous zéro. Elles se disent
              par le TEXTE — une estimation n'est pas un résultat, elle n'a droit ni
              au rouge ni au vert.
            */}
            {manque || tresorerieNegative ? (
              <ul className="space-y-1 text-sm leading-relaxed text-slate-200">
                {manque ? (
                  <li className="flex items-start gap-2">
                    <Icone nom="alerte" className="mt-0.5 h-4 w-4 text-slate-400" />
                    <span>
                      Vous ne pourrez livrer que{" "}
                      <strong className="font-semibold tabular-nums">
                        {formatUnits(estime.ventesLivrables)} {v.units}
                      </strong>{" "}
                      : {formatUnits(estime.manquantes)} de vos ventes estimées manqueraient, faute
                      de stock et de capacité.
                    </span>
                  </li>
                ) : null}
                {tresorerieNegative ? (
                  <li className="flex items-start gap-2">
                    <Icone nom="alerte" className="mt-0.5 h-4 w-4 text-slate-400" />
                    <span>
                      La trésorerie estimée passe sous zéro :{" "}
                      <strong className="font-semibold tabular-nums">
                        {formatEuro(estime.tresorerieNette)}
                      </strong>{" "}
                      en fin de tour. Le découvert comble l&apos;écart, et il se paie.
                    </span>
                  </li>
                ) : null}
              </ul>
            ) : null}
            <CompteEstime estime={estime} />
            {cockpit ? <div>{cockpit}</div> : null}
          </div>
        </Repliable>
      )}
      <AnnonceEstimee resume={resume} />
    </section>
  );
}

/** Le compte de résultat estimé, dans la grammaire des tableaux financiers. */
function CompteEstime({ estime }: { estime: ResultatEstime }) {
  return (
    <div className="tableau-financier">
      <table className="text-sm">
        <caption className="sr-only">
          Compte de résultat estimé du tour, en cascade, selon les ventes estimées par
          l&apos;équipe. Ce n&apos;est pas un résultat : le marché n&apos;a pas répondu.
        </caption>
        <thead>
          <tr className="libelle border-b border-white/10">
            <th scope="col" className="py-1 pr-3 text-left font-medium">
              Poste
            </th>
            <th scope="col" className="py-1 pl-2 text-right font-medium sm:pl-3">
              Estimé
            </th>
          </tr>
        </thead>
        <tbody>
          {lignesDuCompte(estime.compte).map((ligne) => (
            <tr key={ligne.cle} className={ligne.fort ? "border-t border-white/15" : ""}>
              <th
                scope="row"
                className={`py-1 pr-3 text-left font-normal ${
                  ligne.fort
                    ? "font-semibold text-slate-100"
                    : ligne.decalee
                      ? "pl-3 text-slate-400"
                      : "text-slate-300"
                }`}
              >
                {ligne.label}
              </th>
              <td
                className={`whitespace-nowrap py-1 pl-2 text-right tabular-nums sm:pl-3 ${
                  ligne.fort ? "font-semibold text-slate-100" : "text-slate-200"
                }`}
              >
                {formatEuro(ligne.valeur)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * SUR TÉLÉPHONE, UNE LIGNE COMPACTE SUR CHAQUE CARTE DE DÉCISION (lot P7).
 *
 * Elle ne vivait que sur la carte des ventes estimées : sur la commande
 * exceptionnelle, l'approvisionnement, les budgets, le financement, plus rien.
 * Elle a d'abord été posée dans le pied FIXE du parcours (mesuré : 65 px à
 * chaque carte, et la règle du lot 3A, une carte tient sur un écran, passe
 * devant). Elle prend désormais une place qui existait déjà : la ligne
 * d'en-tête de la barre du parcours (« DÉCISION · 3 SUR 12 … »), où
 * « NOVA · Tour 1/6 » lui cède la place pendant la décision (le nom et le tour
 * sont dits par le briefing et l'ardoise). Pas un pixel de plus par carte.
 *
 * Touchée, elle déplie le détail (chiffre d'affaires, stock, trésorerie,
 * alertes) dans un TIROIR posé sous la barre, par-dessus la carte, qui ne la
 * fait pas défiler ; il se referme par le même geste, par Échap ou en touchant
 * ailleurs. Tant que rien n'est estimé, elle invite à estimer et mène au champ.
 */
export function LigneEstimeeCompacte({
  estimation,
  allerAuChamp,
}: {
  estimation: EstimationEnCours | null;
  /** Mène au champ des ventes estimées, sur sa carte. */
  allerAuChamp?: () => void;
}) {
  const repli = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const el = repli.current;
    if (!el) return;
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape" && el.open) el.open = false;
    };
    const aCote = (e: Event) => {
      if (el.open && !el.contains(e.target as Node)) el.open = false;
    };
    document.addEventListener("keydown", auClavier);
    document.addEventListener("pointerdown", aCote);
    return () => {
      document.removeEventListener("keydown", auClavier);
      document.removeEventListener("pointerdown", aCote);
    };
  }, [estimation?.vide]);
  if (!estimation) return null;
  if (estimation.vide) {
    return (
      <span data-ligne-estimee="" className="flex min-w-0 justify-end">
        <button
          type="button"
          onClick={allerAuChamp}
          aria-label={INVITATION_A_ESTIMER}
          className="cible-etendue truncate font-medium text-slate-100 underline decoration-1 underline-offset-4"
        >
          Estimez vos ventes
        </button>
        <AnnonceEstimee resume={estimation} />
      </span>
    );
  }
  const e = estimation;
  return (
    <>
    <details ref={repli} data-ligne-estimee="" className="min-w-0">
      <summary
        aria-label={`${TITRE_ESTIME} : résultat net ${formatEuro(e.resultatNet)}. Voir le détail`}
        className="cible-etendue flex cursor-pointer list-none items-center justify-end gap-1 [&::-webkit-details-marker]:hidden"
      >
        {/* Le chevron commun, en tête du résumé (lot P5). */}
        <Chevron className="text-slate-400" />
        <span className="whitespace-nowrap text-slate-400">Rés. estimé</span>{" "}
        <ValeurRafraichie valeur={formatEuro(e.resultatNet)}>
          <span data-resultat-net-estime="" className="whitespace-nowrap font-semibold tabular-nums text-slate-50">
            {formatEuro(e.resultatNet)}
          </span>
        </ValeurRafraichie>
      </summary>
      {/* LE TIROIR, sous la barre et par-dessus la carte : la carte ne défile pas. */}
      <div className="tiroir-estime absolute inset-x-2 top-full z-10 mt-1 p-4 text-left normal-case tracking-normal">
        <p className="text-sm font-semibold text-slate-50">
          {TITRE_ESTIME} <span className="font-normal text-slate-300">· {SOUS_TITRE_ESTIME}</span>
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <dt className="libelle text-slate-300">Résultat net</dt>
            <dd className="chiffre-cle mt-0.5 font-display text-2xl font-bold tabular-nums text-slate-50">
              {formatEuro(e.resultatNet)}
            </dd>
          </div>
          <div>
            <dt className="libelle text-slate-300">Trésorerie fin de tour</dt>
            <dd className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
              <span className="chiffre-cle font-display text-2xl font-bold tabular-nums text-slate-50">
                {formatEuro(e.tresorerieNette)}
              </span>
              {e.tresorerieNette < 0 ? (
                <span className="pastille-etat rounded-full px-2 py-0.5 text-xs font-medium text-slate-100">
                  sous zéro
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="libelle text-slate-300">Chiffre d&apos;affaires</dt>
            <dd className="mt-0.5 tabular-nums text-slate-100">{formatEuro(e.chiffreDAffaires)}</dd>
          </div>
          <div>
            <dt className="libelle text-slate-300">Stock final</dt>
            <dd className="mt-0.5 tabular-nums text-slate-100">
              {formatUnits(e.stockFinal)} {e.unites}
            </dd>
          </div>
        </dl>
        {e.manquantes >= 1 ? (
          <p className="mt-3 flex items-start gap-2 text-sm leading-snug text-slate-200">
            <Icone nom="alerte" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            Vous ne pourrez livrer que {formatUnits(e.ventesLivrables)} {e.unites}.
          </p>
        ) : null}
        {e.tresorerieNette < 0 ? (
          <p className="mt-1.5 flex items-start gap-2 text-sm leading-snug text-slate-200">
            <Icone nom="alerte" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            La trésorerie estimée passe sous zéro.
          </p>
        ) : null}
      </div>
    </details>
    {/* Hors du repli : une région vivante dans un repli fermé ne parle pas. */}
    <AnnonceEstimee resume={e} />
    </>
  );
}
