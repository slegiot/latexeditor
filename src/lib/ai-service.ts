/**
 * AI service — OpenRouter client for DeepSeek R1 0528.
 * Two capabilities:
 *   1. fixLatexErrors  — send LaTeX + errors → get corrected LaTeX
 *   2. generateFromPrompt — send text description → get full LaTeX document
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-r1-0528";

function getApiKey(): string {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("OPENROUTER_API_KEY is not set");
    return key;
}

interface StreamOptions {
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    maxTokens?: number;
}

/**
 * Streams an OpenRouter chat completion. Returns a ReadableStream of text deltas.
 */
export async function streamChat(opts: StreamOptions): Promise<ReadableStream<Uint8Array>> {
    const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${getApiKey()}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://latexforge.dev",
            "X-Title": "LatexForge",
        },
        body: JSON.stringify({
            model: MODEL,
            messages: opts.messages,
            max_tokens: opts.maxTokens ?? 4096,
            stream: true,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter error ${res.status}: ${err}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let inThinking = false;

    return new ReadableStream({
        async pull(controller) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    controller.close();
                    return;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith("data: ")) continue;
                    const data = trimmed.slice(6);
                    if (data === "[DONE]") {
                        controller.close();
                        return;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        let delta = parsed.choices?.[0]?.delta?.content;
                        if (!delta) continue;

                        // Filter out DeepSeek R1 <think>...</think> reasoning tokens
                        if (inThinking) {
                            const endIdx = delta.indexOf("</think>");
                            if (endIdx !== -1) {
                                inThinking = false;
                                delta = delta.slice(endIdx + 8);
                            } else {
                                continue; // Still inside thinking, skip entirely
                            }
                        }

                        const startIdx = delta.indexOf("<think>");
                        if (startIdx !== -1) {
                            const before = delta.slice(0, startIdx);
                            const after = delta.slice(startIdx + 7);
                            const endIdx = after.indexOf("</think>");
                            if (endIdx !== -1) {
                                // Thinking block starts and ends in same chunk
                                delta = before + after.slice(endIdx + 8);
                            } else {
                                // Thinking block started but not ended
                                inThinking = true;
                                delta = before;
                            }
                        }

                        if (delta) {
                            controller.enqueue(new TextEncoder().encode(delta));
                        }
                    } catch {
                        // Skip malformed JSON chunks
                    }
                }
            }
        },
    });
}

/**
 * Build the streaming response for fixing LaTeX errors.
 */
export function fixLatexErrors(
    content: string,
    errors: Array<{ line: number; message: string; severity: string }>
): Promise<ReadableStream<Uint8Array>> {
    const errorList = errors
        .map((e) => `Line ${e.line} [${e.severity}]: ${e.message}`)
        .join("\n");

    return streamChat({
        messages: [
            {
                role: "system",
                content: `You are a LaTeX expert. The user has a LaTeX document with compilation errors.
Analyze the errors and return the COMPLETE corrected LaTeX document.
First, briefly explain what was wrong (2-3 sentences max).
Then output the corrected document inside a single \`\`\`latex code fence.
Do NOT add any other code fences. Only output the explanation and one code fence.`,
            },
            {
                role: "user",
                content: `Here is my LaTeX document:\n\n\`\`\`latex\n${content}\n\`\`\`\n\nCompilation errors:\n${errorList}\n\nPlease fix all errors and return the corrected document.`,
            },
        ],
        maxTokens: 8192,
    });
}

/**
 * Build the streaming response for generating a LaTeX document from a prompt.
 */
export function generateFromPrompt(prompt: string): Promise<ReadableStream<Uint8Array>> {
    return streamChat({
        messages: [
            {
                role: "system",
                content: `You are a LaTeX expert. Generate a complete, compilable LaTeX document based on the user's description.
The document should be professional, well-structured, and use appropriate packages.
Output ONLY the LaTeX code inside a single \`\`\`latex code fence. No other text before or after.`,
            },
            {
                role: "user",
                content: `Generate a LaTeX document for: ${prompt}`,
            },
        ],
        maxTokens: 8192,
    });
}
