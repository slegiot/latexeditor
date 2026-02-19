// ─────────────────────────────────────────────────────────────
// LaTeXForge — AI LaTeX Assistance Service
// ─────────────────────────────────────────────────────────────
// Connects to OpenRouter (stepfun/step-3.5-flash:free) to
// provide context-aware LaTeX AI assistance:
//   ✦ Ghost-text autocompletion
//   ✦ Math formula suggestions
//   ✦ Rewrite (formalise / shorten) selected text
//
// All prompts are engineered to preserve LaTeX syntax:
//   - Never break \begin{...}...\end{...} blocks
//   - Never add markdown formatting (no ```, **, etc.)
//   - Output is raw LaTeX only
// ─────────────────────────────────────────────────────────────

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'stepfun/step-3.5-flash:free';

// ── Types ────────────────────────────────────────────────────

export type AIAction = 'complete' | 'math' | 'rewrite';

export interface AIRequest {
    /** The action to perform */
    action: AIAction;
    /** Text before the cursor (context window) */
    prefix: string;
    /** Text after the cursor (context window) */
    suffix: string;
    /** Selected text (only for 'rewrite') */
    selection?: string;
    /** Rewrite mode */
    rewriteMode?: 'formalise' | 'shorten' | 'expand';
    /** Full document content for broader context (truncated) */
    documentContext?: string;
}

export interface AIResponse {
    /** The generated text */
    text: string;
    /** Estimated tokens used */
    tokensUsed?: number;
}

// ── System Prompts ───────────────────────────────────────────

const SYSTEM_BASE = `You are an expert LaTeX writing assistant embedded in a LaTeX editor.

CRITICAL RULES — you MUST follow these at ALL times:
1. Output ONLY raw LaTeX text. Never use markdown formatting (no \`\`\`, no **, no ##).
2. NEVER break existing \\begin{...}...\\end{...} environment blocks.
3. If you open a \\begin{env}, you MUST close it with a matching \\end{env}.
4. Preserve the user's existing formatting style (indentation, spacing).
5. Do NOT include explanations, comments, or meta-text — output ONLY the LaTeX content.
6. Do NOT wrap your output in code blocks or quotes.
7. Match the user's language (if they write in English, respond in English).`;

const PROMPTS: Record<AIAction, string> = {
    complete: `${SYSTEM_BASE}

You are providing ghost-text autocompletion. The user's cursor is at the boundary between the PREFIX and SUFFIX. Generate a natural, contextually appropriate continuation of 1-3 sentences.

Rules for completion:
- Continue the current sentence/paragraph naturally.
- If inside a math environment ($...$, \\[...\\], equation, align), complete the mathematics.
- If inside a \\begin{itemize} or \\begin{enumerate}, add the next \\item.
- If after a \\section{}, write an opening paragraph for that section.
- Keep completions concise (1-3 sentences max).
- Do NOT repeat text that already exists in the prefix or suffix.`,

    math: `${SYSTEM_BASE}

You are suggesting a context-aware mathematical formula. Based on the surrounding text and the user's cursor position, suggest an appropriate mathematical expression.

Rules for math suggestions:
- If the context discusses an equation, provide the corresponding LaTeX formula.
- Use appropriate math environments (inline $...$ for short expressions, \\[...\\] or equation for display math).
- Use standard LaTeX math commands (\\frac, \\sum, \\int, \\alpha, etc.).
- If the context mentions "derivative", "integral", "matrix", "limit", etc., generate the corresponding LaTeX.
- Ensure all brackets and environments are properly balanced.
- Provide ONE formula suggestion, not multiple alternatives.`,

    rewrite: `${SYSTEM_BASE}

You are rewriting a selected block of LaTeX text. Output ONLY the rewritten version — do not include the original.

CRITICAL: Your output replaces the selected text directly. It must be valid LaTeX that fits seamlessly into the surrounding document.`,
};

// ── Rewrite Mode Instructions ────────────────────────────────

const REWRITE_MODES: Record<string, string> = {
    formalise: `Rewrite the text in a more formal, academic tone suitable for a scientific paper. 
- Use passive voice where appropriate ("It was observed" instead of "We saw")
- Replace colloquial expressions with formal alternatives
- Maintain technical precision
- Keep all LaTeX commands and environments intact`,

    shorten: `Condense the text to be more concise while preserving the core meaning.
- Remove redundant phrases and filler words
- Combine short sentences where possible
- Keep all essential information and all LaTeX commands
- Target approximately 50-70% of the original length`,

    expand: `Expand the text with more detail, explanation, and connecting language.
- Add transitional phrases between ideas
- Elaborate on technical concepts
- Add clarifying subclauses
- Keep the same academic tone and all LaTeX commands intact`,
};

// ── OpenRouter API Call ──────────────────────────────────────

export async function callAI(
    request: AIRequest,
    apiKey: string
): Promise<AIResponse> {
    const systemPrompt = PROMPTS[request.action];
    const userMessage = buildUserMessage(request);

    const body = {
        model: MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ],
        max_tokens: request.action === 'complete' ? 200 : 500,
        temperature: request.action === 'complete' ? 0.3 : 0.4,
        top_p: 0.9,
        stop: request.action === 'complete'
            ? ['\n\n\n', '\\section{', '\\chapter{', '\\end{document}']
            : undefined,
    };

    const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'LaTeXForge',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        throw new Error(`OpenRouter API error (${res.status}): ${errText}`);
    }

    const data = await res.json();

    const text = data.choices?.[0]?.message?.content?.trim() || '';
    const tokensUsed = data.usage?.total_tokens;

    // Post-process: strip any accidental markdown formatting
    const cleaned = cleanAIOutput(text);

    return { text: cleaned, tokensUsed };
}

// ── User Message Builder ─────────────────────────────────────

function buildUserMessage(request: AIRequest): string {
    const { action, prefix, suffix, selection, rewriteMode, documentContext } = request;

    // Truncate context windows to avoid token bloat
    const trimmedPrefix = prefix.slice(-2000);
    const trimmedSuffix = suffix.slice(0, 1000);

    switch (action) {
        case 'complete':
            return [
                documentContext ? `[Document context]\n${documentContext.slice(0, 500)}\n` : '',
                `[Text before cursor]\n${trimmedPrefix}`,
                `[Text after cursor]\n${trimmedSuffix}`,
                '',
                'Continue writing from the cursor position. Output ONLY the new text to insert.',
            ].filter(Boolean).join('\n');

        case 'math':
            return [
                `[Text before cursor]\n${trimmedPrefix}`,
                `[Text after cursor]\n${trimmedSuffix}`,
                '',
                'Suggest a mathematical formula that fits this context. Output ONLY the LaTeX formula.',
            ].filter(Boolean).join('\n');

        case 'rewrite': {
            const modeInstructions = REWRITE_MODES[rewriteMode || 'formalise'] || REWRITE_MODES.formalise;
            return [
                `[Mode instructions]\n${modeInstructions}`,
                '',
                `[Text before selection]\n${trimmedPrefix.slice(-500)}`,
                `[Selected text to rewrite]\n${selection || ''}`,
                `[Text after selection]\n${trimmedSuffix.slice(0, 500)}`,
                '',
                'Rewrite the selected text according to the mode instructions. Output ONLY the rewritten LaTeX text.',
            ].join('\n');
        }

        default:
            return trimmedPrefix;
    }
}

// ── Output Sanitiser ─────────────────────────────────────────

/**
 * Strip accidental markdown/meta formatting from AI output.
 * Ensures the result is clean, insertable LaTeX.
 */
function cleanAIOutput(text: string): string {
    let cleaned = text;

    // Remove markdown code fences
    cleaned = cleaned.replace(/^```(?:latex|tex)?\s*\n?/gm, '');
    cleaned = cleaned.replace(/\n?```\s*$/gm, '');

    // Remove leading/trailing quotes
    cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '');

    // Remove "Here is..." preamble lines
    cleaned = cleaned.replace(/^(?:Here (?:is|are)|Sure|Certainly|Of course)[^\n]*\n+/i, '');

    // Remove trailing meta-commentary
    cleaned = cleaned.replace(/\n+(?:This |Note:|I |The above)[^\n]*$/i, '');

    return cleaned.trim();
}
