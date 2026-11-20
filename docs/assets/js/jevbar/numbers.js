/**
 * Numbers in a sentence, and what each is for. Code finds every number said, in digits or words
 * ("top 10", "a dozen", "twenty-five", "$1.5M", "2 million dollars", "#214"), and knows what each is
 * worth. It can't know what a number is for: "the 5 biggest" is a count, "over $5,000" a floor,
 * "issue 214" an item, "311 calls" part of a name. The judge says which, in the same call as the rest.
 */
/** What a number can be for. Pass your own to `schema.numbers`; these fit most apps. */
export const DEFAULT_NUMBER_ROLES = {
    count: "How many results to show: the top 10, the 5 biggest, the first twenty, a dozen of them",
    at_least: "The lowest value to include: over, above, more than, at least, north of",
    at_most: "The highest value to include: under, below, less than, at most, up to",
    id: "The number of one specific item: #214, issue 45, order 1009, ticket 7",
    name: "Part of the name of something: 311 calls, Route 66, Windows 11, Section 8",
    other: "Something else: a year, a date, a span of time, an age, a distance",
};
const ONES = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, dozen: 12, couple: 2, few: 3, handful: 5 };
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const SCALE = { hundred: 100, thousand: 1e3, k: 1e3, grand: 1e3, million: 1e6, m: 1e6, mm: 1e6, mil: 1e6, billion: 1e9, b: 1e9, bn: 1e9, trillion: 1e12, t: 1e12 };
const has = (table, word) => word !== undefined && Object.hasOwn(table, word);
const wordValue = (word) => (has(ONES, word) ? ONES[word] : TENS[word]);
/**
 * Every number the sentence says, in order, at most `max`: "top 10", "ten", "twenty-five", "a
 * dozen", "$1.5M", "2 million dollars", "500k". A year is a number too; Jev says it's a year.
 */
export function numbersIn(sentence, max = 4) {
    const tokens = sentence.toLowerCase().replace(/(\d),(?=\d{3}\b)/g, "$1").match(/\$|\d+(?:\.\d+)?[a-z]*|[a-z]+/g) ?? [];
    const found = [];
    let i = 0;
    while (i < tokens.length && found.length < max) {
        const start = i;
        let money = false;
        if (tokens[i] === "$") {
            money = true;
            i++;
        }
        // A number is digits or number words, then any scale words: "2 million", "a hundred and fifty",
        // "two hundred fifty thousand". `total` holds the finished thousands, `part` what's under them.
        let total = 0;
        let part = null;
        const digits = /^(\d+(?:\.\d+)?)([a-z]*)$/.exec(tokens[i] ?? "");
        if (digits) {
            part = Number(digits[1]);
            // "1.5m", "500k"; "10th", "5pm" and the like aren't amounts, and aren't read as one.
            if (digits[2] && has(SCALE, digits[2])) {
                part *= SCALE[digits[2]];
                money ||= digits[2] !== "hundred";
            }
            else if (digits[2])
                part = null;
            i++;
        }
        else if (tokens[i] === "a" && ["dozen", "hundred", "thousand", "million", "billion"].includes(tokens[i + 1])) {
            part = tokens[i + 1] === "dozen" ? 12 : 1;
            i += tokens[i + 1] === "dozen" ? 2 : 1;
        }
        const numberWord = (word) => has(ONES, word) || has(TENS, word) || (has(SCALE, word) && word.length > 2);
        // "And" joins the parts of one number ("a hundred and fifty") but also two numbers ("a million
        // and five million"): a scale no smaller than one already said starts the second number.
        let smallest = Infinity;
        let joined = null;
        while (i < tokens.length && (numberWord(tokens[i]) || (tokens[i] === "and" && part !== null && numberWord(tokens[i + 1])))) {
            const word = tokens[i];
            if (word === "and") {
                joined = { i, total, part };
                i++;
                continue;
            }
            if (has(SCALE, word) && word !== "hundred" && SCALE[word] >= smallest && joined) {
                ({ i, total, part } = joined);
                break;
            }
            i++;
            if (has(ONES, word) || has(TENS, word))
                part = (part ?? 0) + wordValue(word);
            else if (part === null)
                break;
            else if (word === "hundred")
                part *= 100;
            else {
                money = true;
                total += part * SCALE[word];
                smallest = Math.min(smallest, SCALE[word]);
                part = 0;
            }
        }
        const value = part === null && total === 0 ? null : total + (part ?? 0);
        if (value === null) {
            i = start + 1;
            continue;
        }
        if (tokens[i] === "dollars" || tokens[i] === "dollar" || tokens[i] === "bucks") {
            money = true;
            i++;
        }
        const text = tokens.slice(start, i).join(" ").replace(/^\$ /, "$");
        if (Number.isFinite(value) && !found.some((seen) => seen.text === text))
            found.push({ text, value, money });
    }
    return found;
}
/** A ready-made `choices` entry for the order a sentence wants its results in. */
export const ORDER_CHOICE = {
    question: "In what order does `sentence` want the results?",
    options: {
        largest: "Biggest or most first: the top ones, the largest amounts, the most common or busiest",
        smallest: "Smallest or fewest first: the bottom ones, the lowest amounts, the least common",
        newest: "Newest or most recent first",
        oldest: "Oldest or earliest first, in date order",
    },
};
