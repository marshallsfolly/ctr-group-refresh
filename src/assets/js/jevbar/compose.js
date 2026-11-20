/** General-purpose primitives: forms and confirmations as much as charts. Use them all, pick some, or add your own. */
export const BUILTIN_PRIMITIVES = {
    callout: {
        about: "One highlighted line at the top: a warning, a heads-up, or a one-look answer. For something urgent or risky, or a question with a short yes-or-no answer.",
        size: "full",
        pin: "top",
    },
    stat: {
        about: "One big number with how it changed. For how many, how much, a total, or a count.",
        words: /\bhow (many|much)\b|\b(count|total|number of)\b/,
        size: "small",
    },
    trend: {
        about: "A line over time. For whether something is rising or falling, or how it changed over a span of time.",
        words: /\b(trend|over time|line chart|per (day|week|month)|by (day|week|month))\b/,
        size: "wide",
    },
    bars: {
        about: "Bars comparing groups. For a breakdown or mix by some category, or which group has the most.",
        words: /\b(breakdown|bar chart|bars|split by)\b/,
        size: "normal",
    },
    rank: {
        about: "A short numbered ranking of who or what is at the top. For who did the most, the worst offenders, the leaders.",
        words: /\b(leaderboard|ranking|ranked|top \d+)\b/,
        size: "normal",
    },
    table: {
        about: "Rows and columns of records. For comparing many records field by field, scanning details, or exporting.",
        words: /\b(table|spreadsheet|columns)\b/,
        size: "wide",
    },
    list: {
        about: "A list of matching items, most relevant first. For seeing which things match a question.",
        words: /\blist\b/,
        size: "tall",
    },
    timeline: {
        about: "Events in order along a time spine. For what happened when, a history, or a sequence of steps.",
        words: /\b(timeline|chronolog\w*)\b/,
        size: "tall",
    },
    detail: {
        about: "One item opened up, with all its fields. For a question about one specific named or numbered item.",
        size: "wide",
    },
    summary: {
        about: "A few written sentences summing up. For a brief, a recap, or what someone should know.",
        words: /\b(summary|summari[sz]e|recap|brief me|tl;?dr)\b/,
        size: "wide",
    },
    form: {
        about: "A form to fill in, already filled from the sentence. For creating, filing, adding, requesting, or submitting something new.",
        size: "wide",
    },
    confirm: {
        about: "A confirmation step before acting. For deleting, closing, sending, or changing many things at once: anything hard to undo.",
        size: "full",
    },
};
export const BUILTIN_LAYOUTS = {
    stack: "One column read top to bottom. For a task to complete (a form to fill in, a change to confirm) or a single piece of information.",
    dashboard: "Headline numbers across the top, charts and lists in a grid below. For an overview, a status check, or how things stand across several measures.",
    board: "Tiles side by side. For a question best answered by looking at two or more views of the data together: a ranking beside a breakdown, a chart beside a list.",
    focus: "One large main piece with smaller supporting pieces in a column beside it. For looking into one thing in depth: one item, one person, one trend.",
};
const offered = (ui, ctx) => Object.entries(ui.primitives).filter(([, def]) => !def.when || def.when(ctx));
/** The composition half of the call. Primitives the words name are not asked about. */
export function uiQuestions(ui, sentence, ctx) {
    const lower = sentence.toLowerCase();
    const questions = {};
    const list = offered(ui, ctx);
    for (const [name, def] of list) {
        if (def.words?.test(lower))
            continue;
        questions[`ui_${name}`] = { type: "noul", instructions: `Someone typed \`sentence\` into an app. Should the screen that responds to it show this piece? Judge by \`sentence\` alone, not by anything already open. ${def.about}` };
    }
    if (list.length > 1) {
        questions.ui_lead = {
            type: "choice",
            instructions: "Someone typed `sentence` into an app. Which one piece should lead the screen that responds to it, shown first and largest? Judge by `sentence` alone.",
            criteria: Object.fromEntries(list.map(([name, def]) => [name, def.about])),
        };
    }
    const layouts = ui.layouts ?? BUILTIN_LAYOUTS;
    if (Object.keys(layouts).length > 1) {
        questions.ui_layout = {
            type: "choice",
            instructions: "Someone typed `sentence` into an app. How should the pieces of the screen that responds to it be arranged? Decide the composition only; what the data is has been decided.",
            criteria: layouts,
        };
    }
    return questions;
}
/** The composition from the answers and the words. */
export function readUi(ui, sentence, answers, ctx) {
    const lower = sentence.toLowerCase();
    const threshold = ui.threshold ?? 0.55;
    const max = ui.max ?? 4;
    const list = offered(ui, ctx);
    const sizeOf = (name) => ui.primitives[name]?.size ?? "normal";
    const block = (primitive, score, via) => ({ primitive, score, via, size: sizeOf(primitive) });
    const named = list.filter(([, def]) => def.words?.test(lower)).map(([name]) => block(name, 1, "words"));
    const scored = list
        .map(([name]) => {
        const answer = answers[`ui_${name}`];
        return block(name, answer?.type === "noul" ? answer.noul : 0, "model");
    })
        .filter((item) => item.score >= threshold && !named.some((n) => n.primitive === item.primitive))
        .sort((a, b) => b.score - a.score);
    // Two or more named is a specification, not a hint: "a chart and a table" is exactly that.
    let blocks = named.length >= 2 ? named : [...named, ...scored];
    if (!blocks.length) {
        const fallback = (ui.fallback ?? list.slice(0, 1).map(([name]) => name)).filter((name) => list.some(([n]) => n === name));
        blocks = fallback.map((name) => block(name, 0, "default"));
    }
    const leadAnswer = answers.ui_lead;
    const lead = leadAnswer?.type === "choice" && blocks.some((item) => item.primitive === leadAnswer.choice) ? leadAnswer.choice : (blocks[0]?.primitive ?? null);
    if (lead)
        blocks = [...blocks.filter((item) => item.primitive === lead), ...blocks.filter((item) => item.primitive !== lead)];
    blocks = blocks.slice(0, Math.max(1, max));
    const pinned = blocks.filter((item) => ui.primitives[item.primitive]?.pin === "top");
    blocks = [...pinned, ...blocks.filter((item) => !pinned.includes(item))];
    const layouts = ui.layouts ?? BUILTIN_LAYOUTS;
    const layoutAnswer = answers.ui_layout;
    const picked = layoutAnswer?.type === "choice" && Object.hasOwn(layouts, layoutAnswer.choice) ? layoutAnswer : null;
    let layout = picked?.choice ?? null;
    if (!ui.layouts && (!picked || picked.confidence < (ui.layoutSure ?? 0.5))) {
        layout = blocks.length <= 1 ? "stack" : blocks.some((item) => item.size === "small") ? "dashboard" : "board";
    }
    return { blocks, layout: layout ?? Object.keys(layouts)[0] ?? null, lead };
}
