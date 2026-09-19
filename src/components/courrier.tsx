import {
  BANDE_DU_PLI,
  MENTION_DU_PLI,
  NATURES,
  dureeDuCourrier,
  type CourrierDef,
} from "@/config/courriers/types";
import { courrierParCode, positionDuCourrier, referenceDuCourrier } from "@/config/courriers/registre";
import { COURRIERS_DE_ROUTINE, estUnCourrierDeRoutine } from "@/config/courriers/routine";
import { LETTRES_DE_MISSION, estUneLettreDeMission } from "@/config/courriers/mission";
import { COURRIERS_EN_RETOUR, estUnCourrierEnRetour } from "@/config/courriers/reponses";
import { BrandMark } from "@/components/brand-mark";

/**
 * LE COURRIER DE L'ENTREPRISE : une enveloppe, puis la lettre qu'elle contient.
 *
 * L'animation d'ouverture est du pur théâtre CSS — le tirage réel est fait par
 * le PRNG seedé du moteur, ou décidé par l'enseignant.
 *
 * LE MÊME PAPIER DES DEUX CÔTÉS. L'enveloppe et sa lettre partagent l'ivoire,
 * l'encre, le filet et l'ombre (classe `papier`, globals.css) : ce qui sort de
 * l'enveloppe doit être de la même matière que l'enveloppe. Elles ne diffèrent
 * que par ce qui les distingue vraiment — les marques postales d'un côté, le
 * texte de l'autre — et se répondent sur trois repères posés au même endroit :
 * l'expéditeur en haut à gauche, la référence en bas à droite, la liasse en
 * bas à gauche.
 *
 * TROIS PLIS. Le recommandé porte sa bande rouge sur la tranche, le pli simple
 * n'a rien, la note de service circule dans une pochette interne : ni timbre
 * ni cachet, mais la grille de circulation des enveloppes navette. Un chef
 * d'atelier n'affranchit pas son rapport.
 *
 * ET UN QUATRIÈME CANAL QUI N'EST PAS DU PAPIER. Le courriel a ses propres
 * objets — `Courriel` pour la ligne fermée, `Message` pour le message ouvert —
 * parce qu'une panne de serveur ne s'annonce pas par la poste. Ils occupent
 * exactement la place de l'enveloppe et de la lettre dans la scène
 * d'ouverture, mais dans l'autre matière (`.ecran`, globals.css) : blanc
 * froid, pas de rabat, pas de timbre, un en-tête à étiquettes. Le canal doit
 * se voir avant d'être lu — c'est lui qui dit si la chose engage.
 */

/**
 * Le courrier d'un code, qu'il vienne d'une liasse ou de la routine. Les
 * courriers de routine ne sont pas au registre — ils ne sont jamais tirés —,
 * mais ils se lisent et s'impriment comme les autres.
 */
const routineParCode = new Map(COURRIERS_DE_ROUTINE.map((c) => [c.code, c]));
/** Les mandats ne sont pas au registre non plus : ils ne se tirent jamais. */
const missionParCode = new Map(LETTRES_DE_MISSION.map((c) => [c.code, c]));
/** Les réponses non plus : elles ne se tirent pas, elles se méritent. */
const retourParCode = new Map(COURRIERS_EN_RETOUR.map((c) => [c.code, c]));

function courrier(code: string): CourrierDef | undefined {
  return (
    courrierParCode.get(code) ??
    routineParCode.get(code) ??
    missionParCode.get(code) ??
    retourParCode.get(code)
  );
}

/**
 * D'où vient ce courrier, pour le pied de page. Les liasses numérotent leurs
 * plis (« NOVA · 7 / 30 ») ; les deux piles hors registre se nomment. Le pied
 * disait « Courrier de routine » pour tout ce qui n'était pas numéroté, ce qui
 * aurait fait passer un mandat des associés pour un relevé bancaire.
 */
function pileDuCourrier(code: string): string {
  const position = positionDuCourrier(code);
  if (position) return `${position.liasse} · ${position.index} / ${position.total}`;
  if (estUneLettreDeMission(code)) return "Lettre de mission";
  if (estUnCourrierEnRetour(code)) return "Courrier en retour";
  return "Courrier de routine";
}

/**
 * L'ENVELOPPE, écrite une fois : l'écran l'anime, le papier l'imprime. C'est
 * ce partage qui garantit que le pli distribué en classe est le même que celui
 * que l'élève ouvre dans l'arène.
 */
export function Enveloppe({
  code,
  liasse,
  destinataire,
  className = "",
}: {
  /** Le courrier contenu, s'il est connu : il donne le timbre et le cachet. */
  code?: string;
  /** La liasse imprimée en pied d'enveloppe. */
  liasse?: string | null;
  /** À qui le pli est adressé : « Tout le marché », « Équipe 3 ». */
  destinataire?: string;
  className?: string;
}) {
  const c = code ? courrier(code) : undefined;
  const nature = c ? NATURES[c.nature] : null;
  const interne = c?.pli === "interne";
  const bande = c ? BANDE_DU_PLI[c.pli] : null;
  const reference = code ? referenceDuCourrier(code) : null;

  return (
    <div className={`papier enveloppe rounded-lg p-3 ${className}`}>
      <div className="relative flex h-full min-h-full flex-col">
        {/* tranche gauche : recommandé en rouge, note de service en ardoise */}
        {bande ? (
          <span
            className="enveloppe-bande absolute inset-y-0 left-0 w-5 rounded-sm py-2 text-center text-xs font-bold uppercase text-white"
            style={{ backgroundColor: c!.pli === "recommande" ? "#b91c1c" : "#475569" }}
          >
            {bande.mention}
          </span>
        ) : null}

        <div className={`flex items-start justify-between gap-2 ${bande ? "pl-7" : ""}`}>
          {/* expéditeur et cachet, en haut à gauche */}
          <span className="min-w-0">
            <span className="douce block text-xs font-semibold uppercase leading-snug tracking-wide">
              {c ? c.expediteur : "Courrier à ouvrir"}
            </span>
            {nature ? (
              <span
                className="mt-1 inline-block -rotate-2 rounded-sm border border-dashed px-1.5 py-0.5 text-xs font-bold uppercase leading-none tracking-wide"
                style={{ borderColor: nature.encre, color: nature.encre }}
              >
                {interne ? "Note de service" : nature.mention}
              </span>
            ) : null}
          </span>
          {/*
            Le timbre, sauf pour la note de service : une enveloppe navette
            n'est jamais affranchie, et c'est à cela qu'on la reconnaît de loin.
          */}
          {interne ? null : (
            <span
              className="enveloppe-timbre flex h-10 w-9 shrink-0 items-center justify-center rounded-[2px] text-lg"
              aria-hidden
            >
              {c ? c.emoji : "✉️"}
            </span>
          )}
        </div>

        {/* la grille de circulation, propre à la pochette interne */}
        {interne ? (
          <div className={`mt-2 ${bande ? "pl-7" : ""}`}>
            <span className="tenue block text-xs uppercase tracking-widest">Circulation</span>
            <span className="enveloppe-circulation mt-1 block h-7 w-full max-w-[11rem]" aria-hidden />
          </div>
        ) : null}

        {/* la fenêtre du destinataire */}
        <div className={`mt-auto ${bande ? "pl-7" : ""}`}>
          <span className="creux filet inline-block rounded-sm border border-dashed px-2.5 py-1.5 text-xs leading-relaxed">
            <span className="tenue block text-xs uppercase tracking-widest">Destinataire</span>
            {destinataire ?? "L'entreprise"}
          </span>
        </div>

        <div className={`mt-2 flex items-end justify-between gap-2 ${bande ? "pl-7" : ""}`}>
          <span className="tenue flex items-center gap-1.5 text-xs uppercase tracking-[0.15em]">
            <BrandMark className="h-3.5 w-3.5" />
            {liasse ?? "Business Arena"}
          </span>
          {reference ? <span className="tenue text-xs tabular-nums">{reference}</span> : null}
        </div>
      </div>
    </div>
  );
}

/**
 * LA LETTRE, écrite une fois elle aussi.
 *
 * La formule d'appel et la politesse sont DESSINÉES, pas stockées : les
 * répéter dans deux cents textes serait deux cents occasions de les écrire
 * différemment. Ne reste dans la donnée que ce qui varie — qui écrit, à quel
 * sujet, pour dire quoi. Une note de service, elle, n'en porte aucune : on
 * n'écrit pas « Madame, Monsieur » à son propre atelier.
 */
export function Lettre({
  code,
  annonce = false,
  destinataire,
  surligne = false,
}: {
  code: string;
  /** Courrier annoncé par l'enseignant, pas encore appliqué. */
  annonce?: boolean;
  destinataire?: string;
  /** Vrai quand le courrier s'adresse à l'entreprise de celui qui le lit. */
  surligne?: boolean;
}) {
  const c = courrier(code);
  if (!c) return null;
  const nature = NATURES[c.nature];
  const reference = referenceDuCourrier(code);
  const duree = dureeDuCourrier(c);
  /*
   * SANS EFFET SUR LES COMPTES : l'éclair et les pastilles de durée promettent
   * une conséquence mécanique. Les courriers de routine n'en ont pas, le
   * mandat des associés non plus, et les réponses aux décisions pas davantage
   * — le moteur a déjà chiffré la conséquence, elles la nomment — il dit qui confie quoi. Leur donner
   * « ⚡ ... ● » aurait fait chercher aux élèves un effet qui n'arrive jamais.
   */
  const sansEffet =
    estUnCourrierDeRoutine(code) || estUneLettreDeMission(code) || estUnCourrierEnRetour(code);
  const interne = c.pli === "interne";

  return (
    <div
      className="papier lettre rounded-lg p-3"
      style={
        {
          "--cachet": nature.encre,
          // Le liseré du destinataire est écrit en dur : sur du papier, un
          // jeton de thème s'inverserait avec le site.
          ...(surligne ? { boxShadow: "0 0 0 2px #0369a1" } : {}),
        } as React.CSSProperties
      }
    >
      {/*
        `min-h-full` et non `h-full` : la hauteur est un plancher, pas un
        plafond. Une lettre au corps long grandit avec son contenu au lieu
        d'en laisser déborder la signature ; en rangée, toutes prennent la
        hauteur de la plus haute (globals.css).
      */}
      <div className="flex min-h-full flex-col">
        {/* en-tête : qui écrit, et sous quelle forme */}
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 font-display text-xs font-semibold uppercase leading-snug tracking-wide">
            {c.expediteur}
          </span>
          <span
            className="shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide"
            style={{ borderColor: nature.encre, color: nature.encre }}
          >
            {annonce ? "annoncé" : nature.label}
          </span>
        </div>
        <div className="filet mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b pb-2 text-xs">
          <span
            className={c.pli === "simple" ? "tenue" : "font-semibold"}
            style={c.pli === "recommande" ? { color: "#b91c1c" } : undefined}
          >
            {MENTION_DU_PLI[c.pli]}
          </span>
          {reference ? <span className="tenue tabular-nums">Nos réf. : {reference}</span> : null}
        </div>

        {destinataire ? (
          <span
            className={`mt-2.5 inline-flex w-fit rounded-full border px-2 py-0.5 text-xs font-semibold ${
              surligne ? "" : "filet creux tenue"
            }`}
            style={surligne ? { borderColor: "#0369a1", color: "#0369a1" } : undefined}
          >
            {destinataire}
          </span>
        ) : null}

        <p className="mt-2.5 text-sm font-semibold leading-snug">
          <span className="tenue">Objet : </span>
          {c.objet}
        </p>

        {interne ? null : <p className="douce mt-2.5 text-xs italic">Madame, Monsieur,</p>}
        <p className={`douce ${interne ? "mt-2.5" : "mt-1"} text-xs leading-relaxed`}>{c.corps}</p>
        <p className="douce mt-2 text-right text-xs italic leading-snug">
          {interne ? null : (
            <>
              Veuillez agréer nos salutations distinguées.
              <br />
            </>
          )}
          <span className="not-italic">{c.signataire}</span>
        </p>

        {/* ce que l'entreprise doit en faire, et ses pastilles de durée */}
        <div className="creux filet mt-auto rounded-lg border px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-xs font-semibold leading-snug ${sansEffet ? "douce" : ""}`}>
              {sansEffet ? "🗂️" : "⚡"} {c.effet}
            </p>
            {sansEffet ? null : (
              <span
                className="tenue mt-0.5 shrink-0 text-xs tracking-widest"
                aria-label={`${duree} tour${duree > 1 ? "s" : ""}`}
                title={`${duree} tour${duree > 1 ? "s" : ""}`}
              >
                {"●".repeat(duree)}
              </span>
            )}
          </div>
        </div>
        <p className="douce mt-2 text-xs leading-snug">💡 {c.enJeu}</p>

        <div className="filet mt-2 flex items-end justify-between border-t pt-1.5">
          <span className="tenue text-xs uppercase tracking-[0.15em]">
            {pileDuCourrier(code)}
          </span>
          <span className="text-base" aria-hidden>
            {c.emoji}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * LE COURRIEL FERMÉ : une ligne de boîte de réception.
 *
 * Il joue le rôle de l'enveloppe — l'objet qu'on voit avant d'ouvrir — mais il
 * ne lui ressemble en rien, et c'est voulu : on reconnaît un message non lu à
 * son point plein et à son expéditeur en gras, pas à un rabat et à un timbre.
 * Il porte l'heure plutôt qu'un cachet, parce qu'un courriel arrive dans la
 * journée quand une lettre arrive dans la semaine.
 */
export function Courriel({
  code,
  destinataire,
  className = "",
}: {
  code?: string;
  destinataire?: string;
  className?: string;
}) {
  const c = code ? courrier(code) : undefined;
  const nature = c ? NATURES[c.nature] : null;
  const reference = code ? referenceDuCourrier(code) : null;

  return (
    <div className={`ecran courriel rounded-md p-3 ${className}`}>
      <div className="flex h-full min-h-full flex-col">
        <div className="creux filet -mx-3 -mt-3 mb-3 flex items-center justify-between gap-2 border-b px-3 py-1.5">
          <span className="tenue text-xs font-semibold uppercase tracking-[0.15em]">
            Boîte de réception
          </span>
          <span className="tenue text-xs tabular-nums">1 non lu</span>
        </div>

        <div className="flex items-start gap-2.5">
          <span aria-hidden className="courriel-point mt-1.5 h-2 w-2 shrink-0 rounded-full" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold leading-snug">
              {c ? c.expediteur : "Message à ouvrir"}
            </span>
            {c ? (
              <span className="douce mt-1 block text-xs leading-snug">{c.objet}</span>
            ) : null}
          </span>
          {c ? (
            <span aria-hidden className="shrink-0 text-lg leading-none">
              {c.emoji}
            </span>
          ) : null}
        </div>

        {/* Le destinataire en clair sous l'objet, et non dans une fenêtre
            encadrée : une boîte de réception n'a pas de fenêtre d'enveloppe. */}
        <span className="tenue mt-1.5 block pl-[1.125rem] text-xs leading-snug">
          À {destinataire ?? "L'entreprise"}
        </span>

        {nature ? (
          <span
            className="mt-2.5 inline-flex w-fit border-l-2 pl-1.5 text-xs font-semibold uppercase leading-none tracking-wide"
            style={{ borderColor: nature.encre, color: nature.encre }}
          >
            {nature.mention}
          </span>
        ) : null}

        {/*
          LES MESSAGES DÉJÀ LUS, en dessous : deux lignes éteintes, sans texte.
          L'objet fermé prend la hauteur de son voisin ouvert (`h-full` dans la
          scène), et sans elles cette hauteur était un grand vide au milieu de
          la carte. Une boîte de réception qui ne contient qu'un seul message
          n'existe pas ; ces deux lignes disent que celui du jour arrive dans
          une pile, ce qui est le propre du canal.
        */}
        <div aria-hidden className="mt-auto space-y-2 pt-3 opacity-40">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="filet h-2 w-2 shrink-0 rounded-full border" />
              <span className="creux h-1.5 flex-1 rounded-full" style={{ maxWidth: `${88 - i * 22}%` }} />
            </div>
          ))}
        </div>

        <div className="filet mt-2 flex items-end justify-between gap-2 border-t pt-1.5">
          <span className="tenue flex items-center gap-1.5 text-xs uppercase tracking-[0.15em]">
            <BrandMark className="h-3.5 w-3.5" />
            Messagerie
          </span>
          {reference ? <span className="tenue text-xs tabular-nums">{reference}</span> : null}
        </div>
      </div>
    </div>
  );
}

/**
 * LE MESSAGE OUVERT.
 *
 * Même contenu qu'une lettre, autres usages : pas de « Madame, Monsieur », pas
 * de « Veuillez agréer » — on n'écrit pas ainsi un message qu'on envoie dans
 * l'heure. À la place, l'en-tête à étiquettes qui fait reconnaître un courriel
 * de loin, et une mention qui est la vraie leçon du canal : il ne prouve rien.
 */
export function Message({
  code,
  annonce = false,
  destinataire,
  surligne = false,
}: {
  code: string;
  annonce?: boolean;
  destinataire?: string;
  surligne?: boolean;
}) {
  const c = courrier(code);
  if (!c) return null;
  const nature = NATURES[c.nature];
  const reference = referenceDuCourrier(code);
  const duree = dureeDuCourrier(c);
  /*
   * SANS EFFET SUR LES COMPTES : l'éclair et les pastilles de durée promettent
   * une conséquence mécanique. Les courriers de routine n'en ont pas, le
   * mandat des associés non plus, et les réponses aux décisions pas davantage
   * — le moteur a déjà chiffré la conséquence, elles la nomment — il dit qui confie quoi. Leur donner
   * « ⚡ ... ● » aurait fait chercher aux élèves un effet qui n'arrive jamais.
   */
  const sansEffet =
    estUnCourrierDeRoutine(code) || estUneLettreDeMission(code) || estUnCourrierEnRetour(code);

  return (
    <div
      className="ecran message rounded-md"
      style={surligne ? { boxShadow: "0 0 0 2px #0369a1" } : undefined}
    >
      {/* L'en-tête à étiquettes : De, À, Objet. C'est lui qui fait le courriel,
          bien plus que la couleur du fond. */}
      <div className="creux filet border-b px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <span className="tenue text-xs font-semibold uppercase tracking-[0.15em]">Message</span>
          <span
            className="shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide"
            style={{ borderColor: nature.encre, color: nature.encre }}
          >
            {annonce ? "annoncé" : nature.label}
          </span>
        </div>
        <dl className="mt-1.5 grid grid-cols-[2.5rem_1fr] gap-x-2 gap-y-1 text-xs leading-snug">
          <dt className="tenue uppercase tracking-widest">De</dt>
          <dd className="min-w-0 font-semibold">{c.expediteur}</dd>
          <dt className="tenue uppercase tracking-widest">À</dt>
          <dd
            className={`min-w-0 ${surligne ? "font-semibold" : "douce"}`}
            style={surligne ? { color: "#0369a1" } : undefined}
          >
            {destinataire ?? "L'entreprise"}
          </dd>
          <dt className="tenue uppercase tracking-widest">Objet</dt>
          <dd className="min-w-0 font-semibold">{c.objet}</dd>
        </dl>
      </div>

      {/*
        `flex-1` SANS `min-h-full` : le message a un en-tête frère, là où la
        lettre n'en a pas. Une hauteur minimale de 100 % posée ici s'ajoutait à
        celle de l'en-tête, et le total dépassait le pli — à l'impression,
        l'effet du courrier et la leçon tombaient sous le bord et
        disparaissaient. `flex-1` remplit ce qui reste, ce qui est exactement
        ce qu'on veut.
      */}
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
        <p className="douce text-xs italic">Bonjour,</p>
        <p className="douce mt-1 text-xs leading-relaxed">{c.corps}</p>
        <p className="douce mt-2 text-xs italic leading-snug">
          Cordialement,
          <br />
          <span className="not-italic">{c.signataire}</span>
        </p>

        {/* La mention du canal, en clair : ce qu'un courriel ne fait pas. */}
        <p className="tenue filet mt-2 border-t pt-1.5 text-xs">{MENTION_DU_PLI[c.pli]}</p>

        <div className="creux filet mt-auto rounded-md border px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-xs font-semibold leading-snug ${sansEffet ? "douce" : ""}`}>
              {sansEffet ? "🗂️" : "⚡"} {c.effet}
            </p>
            {sansEffet ? null : (
              <span
                className="tenue mt-0.5 shrink-0 text-xs tracking-widest"
                aria-label={`${duree} tour${duree > 1 ? "s" : ""}`}
                title={`${duree} tour${duree > 1 ? "s" : ""}`}
              >
                {"●".repeat(duree)}
              </span>
            )}
          </div>
        </div>
        <p className="douce mt-2 text-xs leading-snug">💡 {c.enJeu}</p>

        <div className="filet mt-2 flex items-end justify-between border-t pt-1.5">
          <span className="tenue text-xs uppercase tracking-[0.15em]">
            {pileDuCourrier(code)}
          </span>
          {reference ? <span className="tenue text-xs tabular-nums">{reference}</span> : null}
        </div>
      </div>
    </div>
  );
}

/**
 * LA GRILLE D'UNE DISTRIBUTION.
 *
 * À deux colonnes dès qu'il y a deux plis. Mais un courrier seul dans une
 * grille à deux colonnes se range à gauche et laisse la moitié de la carte
 * vide : l'œil cherche le second, qui n'existe pas. Seul, il se centre et
 * prend la largeur d'une lettre — il devient ce qu'il est, la pièce du jour,
 * et non la première d'une paire.
 *
 * TOUS LES COURRIERS D'UNE DISTRIBUTION ONT LA MÊME HAUTEUR, `auto-rows-fr`.
 *
 * Une grille règle chaque rangée sur son propre contenu : à deux, les deux
 * plis s'alignaient déjà (une seule rangée), mais au troisième la seconde
 * rangée prenait sa propre hauteur — mesuré 471, 471, puis 453 px. Les
 * colonnes cessaient de se répondre et la distribution se lisait comme des
 * cartes dépareillées au lieu d'une pile.
 *
 * `auto-rows-fr` donne à toutes les rangées la même piste, réglée sur la plus
 * haute : quatre courriers forment un carré, pas un escalier. Seulement à
 * partir de `sm`, là où la grille a deux colonnes — en colonne unique, sur
 * téléphone, personne n'est côte à côte et imposer la hauteur du plus long à
 * tous ne ferait qu'allonger le défilement.
 */
export function grilleDeCourriers(nombre: number): string {
  return nombre <= 1
    ? "grid gap-3 sm:mx-auto sm:max-w-md"
    : "grid gap-3 sm:auto-rows-fr sm:grid-cols-2";
}

/** Le pli distribué : l'enveloppe, puis la lettre qui en sort. */
export function CourrierRecommande({
  code,
  delayMs = 0,
  annonce = false,
  destinataire,
  surligne = false,
}: {
  code: string;
  delayMs?: number;
  annonce?: boolean;
  /** Destinataire affiché : « Tout le marché » ou « → Équipe 3 ». */
  destinataire?: string;
  surligne?: boolean;
}) {
  const c = courrier(code);
  if (!c) {
    return (
      <div className="rounded-lg border border-amber-400/20 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
        ✉️ {code}
      </div>
    );
  }
  const position = positionDuCourrier(code);
  // Le canal décide des deux objets, et de rien d'autre : la scène, le retard
  // d'ouverture et la place dans la grille sont les mêmes pour tous.
  const parCourriel = c.pli === "email";

  return (
    <div className="pli-scene" style={{ animationDelay: `${delayMs}ms` }}>
      <div className="pli-ouverture" style={{ animationDelay: `${delayMs}ms` }}>
        {parCourriel ? (
          <Courriel code={code} destinataire={destinataire} className="h-full" />
        ) : (
          <Enveloppe
            code={code}
            liasse={position?.liasse}
            destinataire={destinataire}
            className="h-full"
          />
        )}
        {parCourriel ? (
          <Message code={code} annonce={annonce} destinataire={destinataire} surligne={surligne} />
        ) : (
          <Lettre code={code} annonce={annonce} destinataire={destinataire} surligne={surligne} />
        )}
      </div>
    </div>
  );
}
