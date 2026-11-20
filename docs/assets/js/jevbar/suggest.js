/**
 * Questions that work, offered while typing. The app lists its topics, each with a few questions
 * that work as written and the words people use for it. A topic matches when every finished word
 * appears in it and the half-typed last word begins one of its words. Its questions are ranked by how
 * well they match and by an optional weight: say, how much data there is for that topic right now.
 */
/** Filler words that never stop a topic from matching. */
export const DEFAULT_STOP = new Set("a an and any all are at for in is me my near of on show the this to what where when who with within today week month year last".split(" "));
export function suggest(typed, topics, options = {}) {
    const { limit = 8, weight = () => 1, stop = DEFAULT_STOP } = options;
    const words = typed.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    if (!words.length)
        return [];
    const last = words[words.length - 1];
    const out = [];
    for (const topic of topics) {
        const tokens = `${topic.label} ${topic.words ?? ""} ${topic.asks.join(" ")}`.toLowerCase().split(/[^\p{L}\p{N}]+/u);
        const whole = words.slice(0, -1).every((word) => tokens.includes(word) || stop.has(word));
        const partial = stop.has(last) || tokens.some((token) => token.startsWith(last));
        if (!whole || !partial)
            continue;
        const w = weight(topic);
        const inLabel = topic.label.toLowerCase().includes(last) ? 2 : 0;
        topic.asks.forEach((ask, index) => {
            const prefix = ask.toLowerCase().startsWith(typed.toLowerCase().trim()) ? 4 : 0;
            out.push({ ask, topic, score: prefix + inLabel + w - index * 0.5 });
        });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, limit);
}
