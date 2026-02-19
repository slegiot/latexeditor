// ─────────────────────────────────────────────────────────────
// LaTeXForge — SMILES → ChemFig Converter
// ─────────────────────────────────────────────────────────────
// Converts SMILES notation to ChemFig LaTeX syntax.
// Handles:
//   ✦ Linear chains (C-C-O → -[:0]-[:0]O)
//   ✦ Branches (C(=O)(O)C)
//   ✦ Ring notation (c1ccccc1 → benzene)
//   ✦ Common bond types (single, double, triple)
//   ✦ Charges and hydrogen counts
//   ✦ Common molecule templates
// ─────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────

export interface ChemFigResult {
    chemfig: string;
    packages: string[];
    warnings: string[];
}

// ── Quick Templates ──────────────────────────────────────────
// For common molecules, mapped from name or SMILES to ChemFig

export const MOLECULE_TEMPLATES: Record<string, { name: string; smiles: string; chemfig: string }> = {
    water: {
        name: 'Water',
        smiles: 'O',
        chemfig: 'H-[:30]O-[:-30]H',
    },
    ethanol: {
        name: 'Ethanol',
        smiles: 'CCO',
        chemfig: 'H_3C-[:30]CH_2-[:-30]OH',
    },
    acetic_acid: {
        name: 'Acetic Acid',
        smiles: 'CC(=O)O',
        chemfig: 'H_3C-[:30](=[2]O)-[:-30]OH',
    },
    benzene: {
        name: 'Benzene',
        smiles: 'c1ccccc1',
        chemfig: '*6(=-=-=-)',
    },
    glucose: {
        name: 'Glucose',
        smiles: 'OC[C@@H](O)[C@H](O)[C@@H](O)[C@@H](O)C=O',
        chemfig: 'HO-[:30]-[:-30](-[:90]OH)-[:30](-[:-90]OH)-[:-30](-[:90]OH)-[:30](-[:-90]OH)-[:-30](=[2]O)',
    },
    aspirin: {
        name: 'Aspirin',
        smiles: 'CC(=O)Oc1ccccc1C(=O)O',
        chemfig: 'H_3C-[:30](=[2]O)-[:-30]O-[:30]*6(=-=(-[:-30](=[:-90]O)-[:30]OH)-=-)',
    },
    caffeine: {
        name: 'Caffeine',
        smiles: 'Cn1c(=O)c2c(ncn2C)n(C)c1=O',
        chemfig: '*6(N(-CH_3)-(*5(-N=(-CH_3)-N=))-(=O)-N(-CH_3)-(=O)-)',
    },
    methane: {
        name: 'Methane',
        smiles: 'C',
        chemfig: 'H-[:90]C(-[:0]H)(-[:180]H)-[:-90]H',
    },
    ammonia: {
        name: 'Ammonia',
        smiles: 'N',
        chemfig: 'H-[:150]N(-[:30]H)-[:-90]H',
    },
    co2: {
        name: 'Carbon Dioxide',
        smiles: 'O=C=O',
        chemfig: 'O=[:0]C=[:0]O',
    },
};

// ── SMILES → ChemFig Converter ───────────────────────────────

/**
 * Convert a SMILES string to ChemFig notation.
 * This is a simplified converter that handles common patterns.
 */
export function smilesToChemFig(smiles: string): ChemFigResult {
    const warnings: string[] = [];

    // Check templates first
    const templateKey = Object.keys(MOLECULE_TEMPLATES).find(
        (k) => MOLECULE_TEMPLATES[k].smiles === smiles
    );
    if (templateKey) {
        return {
            chemfig: MOLECULE_TEMPLATES[templateKey].chemfig,
            packages: ['chemfig'],
            warnings: [],
        };
    }

    // Attempt basic conversion
    try {
        const chemfig = convertSMILES(smiles, warnings);
        return { chemfig, packages: ['chemfig'], warnings };
    } catch (e) {
        warnings.push(`Conversion error: ${(e as Error).message}`);
        return {
            chemfig: `\\text{${smiles}}`,
            packages: ['chemfig'],
            warnings,
        };
    }
}

function convertSMILES(smiles: string, warnings: string[]): string {
    // Detect aromatic rings
    if (/c1.*1/.test(smiles)) {
        return convertAromaticRing(smiles, warnings);
    }

    const parts: string[] = [];
    let i = 0;
    let angle = 30; // Zigzag angle
    let depth = 0;

    while (i < smiles.length) {
        const char = smiles[i];

        switch (char) {
            case '(': {
                // Branch start
                depth++;
                parts.push('(-');
                i++;
                break;
            }
            case ')': {
                // Branch end
                depth--;
                parts.push(')');
                i++;
                break;
            }
            case '=': {
                // Double bond
                parts.push(`=[${angle > 0 ? ':' + angle : ':' + angle}]`);
                angle = -angle; // Zigzag
                i++;
                break;
            }
            case '#': {
                // Triple bond
                parts.push(`~[${angle > 0 ? ':' + angle : ':' + angle}]`);
                angle = -angle;
                i++;
                break;
            }
            case '-': {
                // Explicit single bond (often implicit)
                i++;
                break;
            }
            case '[': {
                // Bracket atom
                const end = smiles.indexOf(']', i);
                if (end === -1) {
                    warnings.push('Unclosed bracket atom');
                    i++;
                    break;
                }
                const bracketContent = smiles.slice(i + 1, end);
                parts.push(parseBracketAtom(bracketContent));
                i = end + 1;
                break;
            }
            case '+':
            case '-': {
                // Charge (inside brackets, handled above; otherwise skip)
                i++;
                break;
            }
            default: {
                // Atom symbol
                const atom = parseAtom(smiles, i);
                if (atom) {
                    if (parts.length > 0 && depth === 0) {
                        parts.push(`-[:${angle}]`);
                        angle = -angle;
                    }
                    parts.push(formatAtom(atom.symbol, atom.hCount));
                    i = atom.endIdx;
                } else {
                    i++;
                }
                break;
            }
        }
    }

    return parts.join('');
}

function convertAromaticRing(smiles: string, warnings: string[]): string {
    // Count aromatic atoms for ring size
    const aromaticCount = (smiles.match(/[cnosp]/g) || []).length;

    // Check for substituents
    const subs = extractRingSubstituents(smiles, warnings);

    if (aromaticCount === 6) {
        if (subs.length === 0) {
            return '*6(=-=-=-)';
        }
        // Build with substituents
        const bonds = ['=', '-', '=', '-', '=', '-'];
        const result = bonds.map((bond, idx) => {
            const sub = subs.find((s) => s.position === idx);
            if (sub) {
                return `${bond}(-${sub.chemfig})`;
            }
            return bond;
        });
        return `*6(${result.join('')})`;
    }

    if (aromaticCount === 5) {
        return '*5(-=--=)';
    }

    warnings.push(`Unusual ring size: ${aromaticCount} atoms`);
    return `*${aromaticCount}(${'=-'.repeat(Math.floor(aromaticCount / 2))}${aromaticCount % 2 ? '=' : ''})`;
}

interface RingSub {
    position: number;
    chemfig: string;
}

function extractRingSubstituents(smiles: string, _warnings: string[]): RingSub[] {
    const subs: RingSub[] = [];
    let pos = 0;
    let inRing = false;

    for (let i = 0; i < smiles.length; i++) {
        if (smiles[i] === 'c' || smiles[i] === 'n') {
            if (inRing) pos++;
            inRing = true;
        } else if (smiles[i] === '(' && inRing) {
            // Find matching close
            let depth = 1;
            let j = i + 1;
            while (j < smiles.length && depth > 0) {
                if (smiles[j] === '(') depth++;
                if (smiles[j] === ')') depth--;
                j++;
            }
            const subSmiles = smiles.slice(i + 1, j - 1);
            // Simple substituent conversion
            let chemfig = '';
            for (const c of subSmiles) {
                if (/[A-Z]/.test(c)) chemfig += c;
                else if (c === '=') chemfig = '=' + chemfig;
            }
            if (chemfig) {
                subs.push({ position: pos, chemfig });
            }
            i = j - 1;
        }
    }

    return subs;
}

function parseAtom(smiles: string, idx: number): { symbol: string; hCount: number; endIdx: number } | null {
    const char = smiles[idx];

    // Two-letter atoms
    const twoLetter = smiles.slice(idx, idx + 2);
    const twoLetterAtoms = ['Cl', 'Br', 'Si', 'Na', 'Mg', 'Ca', 'Fe', 'Li', 'Al'];
    if (twoLetterAtoms.includes(twoLetter)) {
        return { symbol: twoLetter, hCount: 0, endIdx: idx + 2 };
    }

    // Single letter atoms
    if (/[A-Z]/.test(char)) {
        return { symbol: char, hCount: 0, endIdx: idx + 1 };
    }

    // Lowercase aromatic (skip in non-ring context)
    if (/[a-z]/.test(char)) {
        return { symbol: char.toUpperCase(), hCount: 0, endIdx: idx + 1 };
    }

    return null;
}

function parseBracketAtom(content: string): string {
    // e.g., "Fe2+", "OH-", "NH4+"
    const match = content.match(/^([A-Z][a-z]?)(\d*)([\+\-]*)$/);
    if (!match) return content;

    const symbol = match[1];
    const count = match[2];
    const charge = match[3];

    let result = symbol;
    if (count) result += `_${count}`;
    if (charge) {
        const sign = charge[0] === '+' ? '+' : '-';
        const n = charge.length > 1 ? charge.length : '';
        result += `^{${n}${sign}}`;
    }

    return result;
}

function formatAtom(symbol: string, hCount: number): string {
    if (hCount > 0) {
        return hCount === 1 ? `${symbol}H` : `${symbol}H_${hCount}`;
    }
    return symbol;
}

// ── mhchem Helpers ───────────────────────────────────────────

/**
 * Common chemical equation templates for the UI.
 */
export const EQUATION_TEMPLATES: { label: string; latex: string }[] = [
    { label: 'Combustion', latex: '\\ce{CH4 + 2O2 -> CO2 + 2H2O}' },
    { label: 'Acid-Base', latex: '\\ce{HCl + NaOH -> NaCl + H2O}' },
    { label: 'Redox', latex: '\\ce{Zn^2+ <=>[\\ce{+ 2e-}][\\ce{- 2e-}] Zn}' },
    { label: 'Photosynthesis', latex: '\\ce{6CO2 + 6H2O ->[light] C6H12O6 + 6O2}' },
    { label: 'Equilibrium', latex: '\\ce{N2 + 3H2 <=> 2NH3}' },
    { label: 'Precipitation', latex: '\\ce{AgNO3 + NaCl -> AgCl v + NaNO3}' },
    { label: 'Radioactive Decay', latex: '\\ce{^{238}_{92}U -> ^{234}_{90}Th + ^{4}_{2}He}' },
    { label: 'Dissolution', latex: '\\ce{NaCl (s) ->[\\ H2O] Na+ (aq) + Cl- (aq)}' },
];
