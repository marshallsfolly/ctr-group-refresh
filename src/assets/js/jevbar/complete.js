/** Words that shape a question rather than name data. Generic enough for most query boxes; pass your own to replace them. */
export const DEFAULT_SHAPES = [
    ["over time", 7], ["by month", 6], ["by year", 5], ["by week", 4], ["by day", 4], ["by category", 6], ["by hour", 3],
    ["as a table", 5], ["as a list", 4], ["as a chart", 4], ["as a bar chart", 4], ["as a line chart", 4],
    ["top 10", 6], ["top ten", 4], ["largest first", 4], ["smallest first", 3], ["newest first", 5], ["oldest first", 4],
    ["last 7 days", 5], ["last 30 days", 6], ["last year", 6], ["this year", 5], ["this month", 5], ["this week", 5], ["today", 4],
    ["compared to last year", 5], ["show me", 6], ["how many", 6],
];
/** What most often follows a word: "by" → "month", "top" → "10". */
export const DEFAULT_NEXT = {
    by: [["category", 6], ["month", 5], ["year", 4], ["week", 3], ["day", 3], ["hour", 3]],
    top: [["10", 6], ["5", 4], ["20", 3]],
    since: [[String(new Date().getUTCFullYear() - 1), 5]],
    last: [["30 days", 6], ["year", 5], ["week", 4], ["7 days", 4], ["6 months", 3]],
    over: [["time", 6]],
    compared: [["to last year", 6]],
    as: [["a table", 5], ["a list", 4], ["a chart", 4]],
};
/** Words that end an entity being typed: "in Denver by month" is Denver, then "by month". */
const ENTITY_STOP = /\b(me|my|the|this|last|by|over|since|as|on|top|with|and|from|during|per|vs|compared)\b/i;
const DEFAULT_TRIGGERS = ["in", "near", "around", "for", "at"];
const lower = (text) => text.toLowerCase();
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** The words after a trigger that could still be an entity being typed: "crime in denv" → { head: "crime in", tail: "denv" }. */
export function entityTail(text, triggers = DEFAULT_TRIGGERS) {
    if (!triggers.length)
        return null;
    const match = new RegExp(`^(.*\\b(?:${triggers.map(escape).join("|")}))\\s+([a-z0-9][a-z0-9 .,'&-]{1,40})$`, "i").exec(text);
    if (!match || ENTITY_STOP.test(match[2]))
        return null;
    return { head: match[1], tail: match[2] };
}
/** The greyed rest of `text`, or "" when nothing is likely enough to offer. */
export function ghostFor(text, sources) {
    if (!text.trim() || text.length > 160)
        return "";
    const typed = lower(text);
    const past = sources.history?.find((item) => item.length > text.length && lower(item).startsWith(typed));
    if (past)
        return past.slice(text.length);
    const slash = /^\/(\S*)$/.exec(text);
    if (slash) {
        if (!slash[1])
            return "";
        const commands = [...(sources.commands ?? [])].sort((a, b) => Number(Boolean(b.core)) - Number(Boolean(a.core)));
        const found = commands.find((item) => item.name.startsWith(lower(slash[1])) && item.name !== lower(slash[1]));
        return found ? found.name.slice(slash[1].length) + (found.needs ? " " : "") : "";
    }
    if (text.startsWith("/"))
        return "";
    if (sources.entities) {
        const tail = entityTail(text, sources.entities.triggers);
        if (tail) {
            const value = sources.entities.values.find((label) => lower(label).startsWith(lower(tail.tail)) && label.length > tail.tail.length);
            return value ? value.slice(tail.tail.length) : "";
        }
    }
    const shapes = sources.shapes ?? DEFAULT_SHAPES;
    const next = sources.next ?? DEFAULT_NEXT;
    if (/\s$/.test(text)) {
        const last = typed.trim().split(/\s+/).pop() ?? "";
        return next[last]?.[0]?.[0] ?? "";
    }
    const words = typed.split(/\s+/);
    const pairs = Object.entries(next).flatMap(([word, rest]) => rest.map(([after, weight]) => [`${word} ${after}`, weight]));
    // Words that already finish a phrase ("by month", just taken with Tab) are left alone, not pushed
    // on into a longer phrase that happens to start the same way.
    for (let take = Math.min(3, words.length); take > 1; take--) {
        const tail = words.slice(-take).join(" ");
        if (shapes.some(([phrase]) => phrase === tail) || pairs.some(([phrase]) => phrase === tail))
            return "";
    }
    const vocab = sources.vocab ?? [];
    for (let take = Math.min(3, words.length); take >= 1; take--) {
        const tail = words.slice(-take).join(" ");
        // One or two letters of a lone word are too little to guess from.
        if (take === 1 && tail.length < 3)
            return "";
        let best = null;
        for (const entry of take > 1 ? [...shapes, ...vocab, ...pairs] : [...shapes, ...vocab]) {
            if (entry[0].length > tail.length && entry[0].startsWith(tail) && (!best || entry[1] > best[1]))
                best = entry;
        }
        if (best)
            return best[0].slice(tail.length);
    }
    return "";
}
