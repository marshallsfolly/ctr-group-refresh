/**
 * What code can find in a sentence exactly, with no model: a stated span of time, a stated distance,
 * and the phrases that might name something (a place, a person, a project). Over-find candidates on
 * purpose; the reader picks one of them or none.
 */
const UNIT_HOURS = { hour: 1, day: 24, week: 168, month: 720, year: 8760 };
/** "last 3 weeks" → 3 weeks; "today" → 1 day; "this year" → 1 year. Null when no span is stated. */
export function statedSpan(sentence) {
    const text = sentence.toLowerCase();
    const match = /\b(?:last|past|previous)\s+(\d+|few|couple(?: of)?)?\s*(hours?|hrs?|days?|weeks?|months?|years?)\b/.exec(text);
    const span = (amount, unit) => ({ amount, unit, hours: amount * UNIT_HOURS[unit] });
    if (match) {
        const amount = match[1] && /^\d+$/.test(match[1]) ? Number(match[1]) : match[1] ? 3 : 1;
        const unit = match[2].startsWith("h") ? "hour" : match[2].startsWith("d") ? "day" : match[2].startsWith("w") ? "week" : match[2].startsWith("y") ? "year" : "month";
        return span(amount, unit);
    }
    if (/\b(right now|just now|this (morning|afternoon|evening)|tonight)\b/.test(text))
        return span(6, "hour");
    if (/\b(today|yesterday|overnight|last night)\b/.test(text))
        return span(1, "day");
    if (/\bthis week\b/.test(text))
        return span(1, "week");
    if (/\bthis month\b/.test(text))
        return span(1, "month");
    if (/\b(this year|all year)\b/.test(text))
        return span(1, "year");
    return null;
}
/** "since 2023" / "since March 2024" → the start date it names, or null. */
export function statedSince(sentence, now = new Date()) {
    const match = /\bsince\s+(?:([a-z]+)\s+)?(\d{4})\b/i.exec(sentence);
    if (!match)
        return null;
    const month = match[1] ? MONTHS.findIndex((name) => match[1].toLowerCase().startsWith(name)) : 0;
    const date = new Date(Date.UTC(Number(match[2]), Math.max(0, month), 1));
    return date <= now ? date : null;
}
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
/** A distance the sentence states, in miles: "within 5 km" → 3.1. */
export function statedDistance(sentence) {
    const text = sentence.toLowerCase();
    const match = /(\d+(?:\.\d+)?)\s*(?:-\s*)?(mi|miles?|km|kilometers?|kilometres?)\b/.exec(text);
    if (match) {
        const n = Number(match[1]);
        return /^k/.test(match[2]) ? n * 0.621371 : n;
    }
    if (/\b(a|one) mile\b/.test(text))
        return 1;
    return null;
}
const FILLER = new Set("in within near around of for at by from to the a an and or with over past last since this that these those me my us our here there today tonight yesterday week weeks day days hour hours month months mile miles show what whats what's is are going on happening new any all only also please about".split(" "));
/**
 * Phrases that might be the thing a sentence names: the words after a lead word ("in", "for", "by",
 * "about"…), every shorter prefix of them, and runs of Capitalized Words. "crime in San Jose, CA by
 * month" gives "San Jose, CA", "San Jose", "San". Duplicates and `exclude` matches are dropped.
 */
export function phraseCandidates(sentence, options = {}) {
    const { leads = ["in", "near", "around", "of", "for", "at", "by", "about", "from", "outside"], exclude, limit = 24, filler = FILLER } = options;
    const words = sentence.replace(/[?!;]/g, " ").split(/\s+/).filter(Boolean);
    const out = [];
    const push = (phrase) => {
        // "Grace Hopper's open bugs" names Grace Hopper.
        const clean = phrase.replace(/^[,.'"]+|[,.'"]+$/g, "").replace(/['’]s$/, "").trim();
        if (clean.length >= 2 && !out.some((item) => item.toLowerCase() === clean.toLowerCase()))
            out.push(clean);
    };
    for (let i = 0; i < words.length; i++) {
        if (!leads.includes(words[i].toLowerCase().replace(/[^a-z]/g, "")))
            continue;
        const span = [];
        for (let j = i + 1; j < words.length && span.length < 6; j++) {
            const raw = words[j];
            const bare = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (filler.has(bare) && !/^\d/.test(raw) && span.length > 0 && !/,$/.test(words[j - 1] ?? ""))
                break;
            // "New" is filler in "anything new", but it starts New York and New Haven.
            if (filler.has(bare) && span.length === 0 && !(bare === "new" && j + 1 < words.length))
                continue;
            span.push(raw);
            // A comma or period ends the phrase, except before a state code: "Portland, OR" keeps going.
            if (/[,.]$/.test(raw) && !/^[A-Z]{2}\b/.test(words[j + 1] ?? ""))
                break;
        }
        for (let k = span.length; k >= 1; k--)
            push(span.slice(0, k).join(" "));
    }
    for (const run of sentence.match(/\b[A-Z][\p{L}'-]+(?:\s+[A-Z][\p{L}'-]+)*(?:,\s*[A-Z]{2})?/gu) ?? []) {
        if (!filler.has(run.toLowerCase()))
            push(run);
    }
    return out.filter((phrase) => !exclude?.test(phrase)).slice(0, limit);
}
/**
 * The clauses of a sentence, for a slot that is a phrase rather than a name: the title of a new
 * issue, the subject of a message. "the login page is broken for everyone, file it now" gives
 * "the login page is broken for everyone" and "file it now"; the judge picks which one is the title.
 * A leading command verb ("file a bug:", "add a task to") is dropped from each clause.
 */
export function clauseCandidates(sentence, options = {}) {
    const { verbs = /^(please\s+)?(file|open|create|add|make|report|submit|log|request|start|write|send)\b(\s+(a|an|the|new|this|that|it))*(\s+\w+)?\s*(:|-|—|about|for|saying|that)\s*/i, limit = 8 } = options;
    const out = [];
    for (const part of sentence.trim().replace(verbs, "").split(/\s*(?:[,;:!?]|\s[-—]\s|\.(?:\s|$))\s*/)) {
        const clause = part.replace(verbs, "").trim();
        if (clause.split(/\s+/).length >= 2 && !out.some((item) => item.toLowerCase() === clause.toLowerCase()))
            out.push(clause);
    }
    return out.slice(0, limit);
}
