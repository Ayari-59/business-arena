import { ACCENT, ACCENT_TRAIT, BLANC, MARINE as M, OMBRE } from "./trait";

/**
 * LES VISAGES DES INTERLOCUTEURS (lot 6B) : en buste, `viewBox` 240 × 240,
 * chacun avec UN attribut qui dit le métier. Les visages n'ont pas de traits :
 * l'âge, la coupe et la silhouette font la personne, l'attribut fait le rôle.
 * Ils se lisent entre 56 et 72 px, dans l'en-tête d'une lettre : rien de ce
 * qui compte n'y est plus fin que quelques pixels.
 */

/** Le fond commun : le halo derrière la tête, légèrement teinté du métier. */
function Fond() {
  return (
    <>
      <rect width={240} height={240} fill={M.mur} />
      <circle cx={120} cy={104} r={80} fill={M.champ} />
      <circle cx={120} cy={104} r={80} style={ACCENT} opacity={0.08} />
    </>
  );
}

/** Le cou et le visage, ovale sans traits. */
function Visage({
  peau = BLANC,
  cou = OMBRE,
  cy = 112,
}: {
  peau?: string;
  cou?: string;
  cy?: number;
}) {
  return (
    <>
      <rect x={109} y={cy + 24} width={22} height={32} fill={cou} />
      <ellipse cx={120} cy={cy} rx={29} ry={35} fill={peau} />
    </>
  );
}

/** Le buste, des épaules au bas du cadre. */
function Epaules({ fill, largeur = 82 }: { fill: string; largeur?: number }) {
  const g = 120 - largeur;
  const d = 120 + largeur;
  return <path d={`M${g} 240C${g} 186 74 164 120 164C166 164 ${d} 186 ${d} 240Z`} fill={fill} />;
}

/** LA BANQUE : la chargée d'affaires, ses lunettes et le dossier de crédit. */
export function PortraitBanque() {
  return (
    <>
      <Fond />
      <Epaules fill={M.fond} />
      <path d="M101 165L120 204L139 165Z" fill={BLANC} />
      <path d="M101 165L120 204L94 240L70 240L84 176Z" fill={M.creux} />
      <path d="M139 165L120 204L146 240L170 240L156 176Z" fill={M.creux} />
      <Visage />
      <path
        d="M90 116C86 82 100 70 121 70C144 70 156 84 151 116C150 130 151 142 157 150L140 150C146 134 146 108 137 98C125 106 108 108 99 105C97 122 97 136 103 150L84 150C90 140 91 128 90 116Z"
        fill={M.nuit}
      />
      <g fill="none" strokeWidth={2.6} style={ACCENT_TRAIT}>
        <rect x={100} y={108} width={16} height={11} rx={4} />
        <rect x={124} y={108} width={16} height={11} rx={4} />
        <path d="M116 112L124 112" />
      </g>
      <rect x={0} y={214} width={240} height={26} fill={M.releve} />
      <rect x={0} y={214} width={240} height={3} fill={BLANC} opacity={0.14} />
      <g transform="rotate(-6 170 210)">
        <rect x={140} y={198} width={60} height={15} rx={1.5} style={ACCENT} />
        <rect x={140} y={198} width={60} height={3} fill={BLANC} opacity={0.3} />
      </g>
      <rect
        x={52}
        y={208}
        width={46}
        height={3.5}
        rx={1.75}
        fill={BLANC}
        transform="rotate(8 75 210)"
      />
    </>
  );
}

/** LE FOURNISSEUR : le livreur barbu, une caisse dans les bras. */
export function PortraitFournisseur() {
  return (
    <>
      <Fond />
      <Epaules fill={M.releve} largeur={88} />
      <path d="M104 166L120 180L136 166Z" fill={M.creux} />
      <Visage />
      {/* les cheveux courts et la barbe pleine */}
      <path
        d="M91 106C88 78 104 70 122 70C142 70 154 82 150 106C146 92 136 86 120 88C104 88 95 94 91 106Z"
        fill={M.nuit}
      />
      <path
        d="M91 112C91 136 102 150 120 150C138 150 149 136 149 112C146 126 140 132 132 132C126 128 114 128 108 132C100 132 94 126 91 112Z"
        fill={M.nuit}
      />
      {/* la caisse, aux couleurs de la maison */}
      <rect x={66} y={182} width={108} height={58} rx={2} style={ACCENT} />
      <rect x={66} y={182} width={108} height={4} fill={BLANC} opacity={0.3} />
      <rect x={114} y={182} width={12} height={58} fill={BLANC} opacity={0.55} />
      <ellipse cx={66} cy={206} rx={9} ry={11} fill={BLANC} />
      <ellipse cx={174} cy={206} rx={9} ry={11} fill={BLANC} />
    </>
  );
}

/** LE PRESTATAIRE TECHNIQUE : la technicienne, casque et gilet. */
export function PortraitTechnicien() {
  return (
    <>
      <Fond />
      <Epaules fill={M.creux} largeur={80} />
      <path d="M72 240L80 180Q92 168 104 166L110 240Z" fill={M.releve} />
      <path d="M168 240L160 180Q148 168 136 166L130 240Z" fill={M.releve} />
      <rect x={74} y={206} width={36} height={6} fill={BLANC} opacity={0.85} />
      <rect x={130} y={206} width={36} height={6} fill={BLANC} opacity={0.85} />
      {/* la queue de cheval qui dépasse du casque */}
      <path d="M140 100Q166 104 160 150Q152 126 140 118Z" fill={M.nuit} />
      <Visage />
      <path
        d="M92 104C92 98 100 96 112 96L128 96C140 96 148 98 148 104L148 110C140 104 100 104 92 110Z"
        fill={M.nuit}
      />
      {/* le casque, à la teinte de la maison */}
      <path d="M86 98C86 64 154 64 154 98Z" style={ACCENT} />
      <rect x={78} y={94} width={84} height={9} rx={4.5} style={ACCENT} />
      <rect x={116} y={68} width={8} height={28} fill={BLANC} opacity={0.3} />
    </>
  );
}

/** LE CLIENT, LE GRAND COMPTE : un acheteur en veste, le badge au cou. */
export function PortraitClient() {
  return (
    <>
      <Fond />
      <Epaules fill={M.fond} />
      <path d="M100 166L120 196L140 166Z" fill={BLANC} />
      <path d="M100 166L120 196L104 240L76 240L84 178Z" fill={M.champ} />
      <path d="M140 166L120 196L136 240L164 240L156 178Z" fill={M.champ} />
      <Visage peau={OMBRE} cou={OMBRE} />
      <rect x={109} y={142} width={22} height={6} fill={M.nuit} opacity={0.15} />
      {/* les cheveux bouclés, hauts */}
      <g fill={M.nuit}>
        <circle cx={98} cy={88} r={16} />
        <circle cx={120} cy={78} r={19} />
        <circle cx={142} cy={88} r={16} />
        <circle cx={92} cy={104} r={9} />
        <circle cx={148} cy={104} r={9} />
      </g>
      {/* le cordon et le badge de visiteur */}
      <path d="M108 168L112 198M132 168L128 198" fill="none" strokeWidth={4} style={ACCENT_TRAIT} />
      <rect x={100} y={194} width={40} height={46} rx={3} style={ACCENT} />
      <rect x={108} y={202} width={24} height={15} rx={1} fill={BLANC} />
      <rect x={108} y={222} width={24} height={4} fill={M.fond} opacity={0.5} />
    </>
  );
}

/** L'ADMINISTRATION : l'inspecteur grisonnant et son tampon. */
export function PortraitAdministration() {
  return (
    <>
      <Fond />
      <Epaules fill={M.creux} largeur={84} />
      <path d="M102 165L120 200L138 165Z" fill={BLANC} />
      <path d="M116 172L124 172L127 216L120 226L113 216Z" fill={M.fond} />
      <path d="M102 165L120 200L100 240L78 240L86 176Z" fill={M.fond} />
      <path d="M138 165L120 200L140 240L162 240L154 176Z" fill={M.fond} />
      <Visage cy={114} />
      {/* crâne dégarni, tempes grises, moustache */}
      <path d="M92 102C91 94 94 89 99 87L101 114L93 116Z" fill={OMBRE} />
      <path d="M148 102C149 94 146 89 141 87L139 114L147 116Z" fill={OMBRE} />
      <path d="M108 128Q120 122 132 128Q126 134 120 132Q114 134 108 128Z" fill={OMBRE} />
      {/* le tampon, levé dans la main */}
      <path d="M150 240L162 194L196 194L208 240Z" fill={M.fond} />
      <rect x={172} y={162} width={12} height={36} fill={M.filet} />
      <circle cx={178} cy={156} r={15} style={ACCENT} />
      <rect x={152} y={196} width={52} height={20} rx={2} style={ACCENT} />
      <rect x={154} y={216} width={48} height={6} fill={M.nuit} />
      <ellipse cx={178} cy={184} rx={12} ry={9} fill={BLANC} />
    </>
  );
}

/** LES ASSOCIÉS : la doyenne aux cheveux blancs, la tablette des résultats. */
export function PortraitAssocies() {
  return (
    <>
      <Fond />
      <Epaules fill={M.releve} largeur={78} />
      <path d="M96 168Q120 196 144 168L148 176Q120 210 92 176Z" fill={M.creux} />
      <Visage peau={BLANC} />
      {/* les cheveux blancs relevés en chignon */}
      <circle cx={120} cy={66} r={15} fill={OMBRE} />
      <path
        d="M90 116C84 84 100 74 120 74C140 74 156 84 150 116C146 98 138 92 126 90C114 96 100 100 90 116Z"
        fill={OMBRE}
      />
      {/* la tablette, et ce qu'elle montre : les résultats du trimestre */}
      <g transform="rotate(-8 120 214)">
        <rect x={74} y={190} width={92} height={60} rx={6} fill={M.nuit} />
        <rect x={80} y={196} width={80} height={48} rx={2} fill={M.creux} />
        <g style={ACCENT}>
          <rect x={88} y={226} width={10} height={14} />
          <rect x={104} y={218} width={10} height={22} />
          <rect x={120} y={222} width={10} height={18} />
          <rect x={136} y={206} width={10} height={34} />
        </g>
      </g>
      <ellipse cx={70} cy={222} rx={10} ry={12} fill={BLANC} />
      <ellipse cx={170} cy={210} rx={10} ry={12} fill={BLANC} />
    </>
  );
}

/** LE SALARIÉ : le jeune équipier, au tablier de la maison. */
export function PortraitSalarie() {
  return (
    <>
      <Fond />
      <Epaules fill={M.champ} largeur={90} />
      <Visage peau={OMBRE} cou={OMBRE} cy={110} />
      <rect x={109} y={138} width={22} height={6} fill={M.nuit} opacity={0.15} />
      {/* la coupe rase, un peu plus longue dessus */}
      <path
        d="M91 104C88 76 104 68 120 68C138 68 152 78 149 104C146 92 140 84 120 84C102 84 94 92 91 104Z"
        fill={M.nuit}
      />
      <rect
        x={146}
        y={96}
        width={22}
        height={4}
        rx={2}
        fill={BLANC}
        transform="rotate(-30 157 98)"
      />
      {/* le tablier à bavette, à la teinte de la maison */}
      <path d="M92 240L92 192L104 182L136 182L148 192L148 240Z" style={ACCENT} />
      <path d="M104 182L98 160M136 182L142 160" fill="none" strokeWidth={4} style={ACCENT_TRAIT} />
      <rect x={108} y={204} width={24} height={16} rx={2} fill={M.nuit} opacity={0.2} />
    </>
  );
}

/** LA PRESSE ET LES OBSERVATEURS : le journaliste et son journal plié. */
export function PortraitPresse() {
  return (
    <>
      <Fond />
      <Epaules fill={M.filet} largeur={76} />
      <path d="M100 166L120 190L140 166Z" fill={M.nuit} />
      <Visage />
      {/* la mèche longue, sur le côté */}
      <path
        d="M90 118C84 82 100 70 122 70C146 70 158 86 150 122C148 104 144 96 138 92C126 102 106 100 96 96C92 104 91 110 90 118Z"
        fill={M.nuit}
      />
      <path d="M96 96C110 92 126 84 138 92C130 82 112 80 96 96Z" fill={M.nuit} />
      {/* le journal plié, sous le bras */}
      <g transform="rotate(-14 160 206)">
        <rect x={120} y={182} width={84} height={50} fill={BLANC} />
        <rect x={126} y={188} width={72} height={8} style={ACCENT} />
        <g fill={M.fond} opacity={0.45}>
          <rect x={126} y={202} width={32} height={3} />
          <rect x={126} y={209} width={32} height={3} />
          <rect x={126} y={216} width={28} height={3} />
          <rect x={164} y={202} width={34} height={17} />
        </g>
        <rect x={120} y={226} width={84} height={6} fill={OMBRE} />
      </g>
      <ellipse cx={116} cy={222} rx={10} ry={12} fill={BLANC} />
    </>
  );
}
