/**
 * Reading a sentence into a typed intent, without a generative model. The app describes what a
 * question can contain (a schema). Code finds what it can find exactly: words that name a subject,
 * spans of time, and the phrases that might be a place or a name. A judging model answers the rest in
 * one round trip: which action, which subjects when they were worded some other way, and which of the
 * found phrases (if any) fills each slot. Whatever code settled wins over the model.
 *
 * The questions follow the TypeSafe systemOne shape: "choice" picks one of several criteria, "noul" is
 * a probability that something holds. Any backend that answers that shape can read for this module;
 * `jevbar/jev` is the one that calls Jev.
 */
import { readUi, uiQuestions } from "./compose.js";
import { DEFAULT_NUMBER_ROLES, numbersIn } from "./numbers.js";
export const NONE = "none";
function actionsFor(schema, ctx) {
    return Object.fromEntries(Object.entries(schema.actions ?? {})
        .filter(([, value]) => typeof value === "string" || !value.when || value.when(ctx))
        .map(([name, value]) => [name, typeof value === "string" ? value : value.about]));
}
/**
 * The questions for one sentence. `context` is whatever else the judge should see, such as what is
 * open on screen; it is sent as state beside the sentence, so describe it in plain words.
 */
export function plan(schema, sentence, context) {
    const questions = {};
    const actions = actionsFor(schema, context);
    if (Object.keys(actions).length > 1) {
        questions.action = { type: "choice", instructions: "What does `sentence` want done?", criteria: actions };
    }
    for (const [name, choice] of Object.entries(schema.choices ?? {})) {
        if (choice.stated?.(sentence))
            continue;
        questions[`choice_${name}`] = { type: "choice", instructions: choice.question, criteria: { ...choice.options, [NONE]: "The sentence does not say" } };
    }
    const candidates = {};
    for (const [name, slot] of Object.entries(schema.slots ?? {})) {
        candidates[name] = slot.candidates(sentence).filter((phrase) => phrase !== NONE);
        if (!candidates[name].length)
            continue;
        questions[`slot_${name}`] = {
            type: "choice",
            instructions: { question: slot.question },
            criteria: { ...Object.fromEntries(candidates[name].map((phrase) => [phrase, null])), [NONE]: "None of these" },
        };
    }
    const lower = sentence.toLowerCase();
    for (const [name, subject] of Object.entries(schema.subjects ?? {})) {
        if (subject.words?.test(lower))
            continue;
        questions[`subject_${name}`] = { type: "noul", instructions: `Does \`sentence\` itself ask about ${subject.about}? Judge only the words of the sentence.` };
    }
    for (const [name, flag] of Object.entries(schema.flags ?? {}))
        questions[`flag_${name}`] = { type: "noul", instructions: flag };
    const numbers = schema.numbers ? numbersIn(sentence) : [];
    const roles = schema.numbers === true ? DEFAULT_NUMBER_ROLES : schema.numbers;
    numbers.forEach((number, i) => {
        questions[`number_${i}`] = { type: "choice", instructions: `What is the number "${number.text}" in \`sentence\` for?`, criteria: roles ?? {} };
    });
    const ui = schema.ui ? uiQuestions(schema.ui, sentence, context) : {};
    const state = { sentence, ...(context !== undefined && context !== null ? (typeof context === "object" ? context : { context }) : {}) };
    const hasContext = Object.keys(state).length > 1;
    const batches = hasContext && Object.keys(ui).length ? [{ state, questions }, { state: { sentence }, questions: ui }] : [{ state, questions: { ...questions, ...ui } }];
    return { sentence, state, questions: { ...questions, ...ui }, batches: batches.filter((batch) => Object.keys(batch.questions).length), candidates, actions: Object.keys(actions), numbers, context };
}
/** The intent from a plan and the model's answers. With no answers, it is what code alone found. */
/** The first number the judge said is for `role`: `numberFor(intent, "count")` → 5 for "the 5 oldest". */
export function numberFor(intent, role) {
    return intent.numbers.find((number) => number.role === role)?.value ?? null;
}
export function read(schema, planned, answers = {}) {
    const { sentence } = planned;
    const lower = sentence.toLowerCase();
    const via = {};
    const threshold = schema.threshold ?? 0.5;
    let action = null;
    const actionAnswer = answers.action;
    if (actionAnswer?.type === "choice" && planned.actions.includes(actionAnswer.choice)) {
        action = actionAnswer.choice;
        via.action = "model";
    }
    else if (planned.actions.length === 1) {
        action = planned.actions[0];
        via.action = "default";
    }
    else if (schema.defaultAction && planned.actions.includes(schema.defaultAction)) {
        action = schema.defaultAction;
        via.action = "default";
    }
    const subjectEntries = Object.entries(schema.subjects ?? {});
    const worded = new Set(subjectEntries.filter(([, subject]) => subject.words?.test(lower)).map(([name]) => name));
    const narrow = worded.size > 0 && !(schema.broad?.test(lower) ?? false);
    const subjects = [];
    for (const [name] of subjectEntries) {
        if (worded.has(name)) {
            subjects.push(name);
            via[`subject:${name}`] = "words";
            continue;
        }
        const answer = answers[`subject_${name}`];
        if (!narrow && answer?.type === "noul" && answer.noul >= threshold) {
            subjects.push(name);
            via[`subject:${name}`] = "model";
        }
    }
    const choices = {};
    for (const [name, choice] of Object.entries(schema.choices ?? {})) {
        const stated = choice.stated?.(sentence) ?? null;
        const answer = answers[`choice_${name}`];
        if (stated) {
            choices[name] = stated;
            via[`choice:${name}`] = "words";
        }
        else if (answer?.type === "choice" && answer.choice !== NONE && Object.hasOwn(choice.options, answer.choice)) {
            choices[name] = answer.choice;
            via[`choice:${name}`] = "model";
        }
        else
            choices[name] = null;
    }
    const slots = {};
    for (const name of Object.keys(schema.slots ?? {})) {
        const answer = answers[`slot_${name}`];
        const found = planned.candidates[name] ?? [];
        slots[name] = answer?.type === "choice" && answer.choice !== NONE && found.includes(answer.choice) ? answer.choice : null;
        if (slots[name])
            via[`slot:${name}`] = "model";
    }
    const flags = {};
    for (const name of Object.keys(schema.flags ?? {})) {
        const answer = answers[`flag_${name}`];
        flags[name] = answer?.type === "noul" ? answer.noul : 0;
    }
    const roles = schema.numbers === true ? DEFAULT_NUMBER_ROLES : (schema.numbers ?? {});
    const numbers = planned.numbers.map((number, i) => {
        const answer = answers[`number_${i}`];
        return { ...number, role: answer?.type === "choice" && Object.hasOwn(roles, answer.choice) ? answer.choice : null };
    });
    const ui = schema.ui ? readUi(schema.ui, sentence, answers, planned.context) : null;
    return { sentence, action, subjects, choices, slots, flags, numbers, ui, candidates: planned.candidates, via };
}
/** Code only, no model: the action falls back to the default, and slots stay empty (their candidates are still listed). */
export function readOffline(schema, sentence, context) {
    return read(schema, plan(schema, sentence, context));
}
/** A reader for one schema: plan the sentence, ask the judge (once, or twice in parallel with context), read the answers. */
export function createReader(schema, judge) {
    return async (sentence, context, signal) => {
        const planned = plan(schema, sentence, context);
        const answers = Object.assign({}, ...(await Promise.all(planned.batches.map((batch) => judge(batch.state, batch.questions, signal)))));
        return read(schema, planned, answers);
    };
}
