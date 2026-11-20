/**
 * Slash commands in the query box: "/since 2023", "/open Budget", "/help". Each one is an exact
 * action that code runs, with no model involved. A command can stand for a sentence ("/since 2023"
 * asks "since 2023"), so it reads and refines the same way a typed question does. The rest
 * (navigation, export, appearance) are for the app to act on directly.
 */
/** How a command reads in the menu and help: "/since <year or date>". */
export function usage(command) {
    return `/${command.name}${command.arg ? ` ${command.arg}` : ""}`;
}
/** Whether the command wants something typed after it before it can run. */
export function takesArg(command) {
    return Boolean(command.needs || (command.arg && !command.arg.startsWith("[")));
}
/** What picking the command puts in the box: "/since " (waiting for the argument) or "/help". */
export function commandFill(command) {
    return takesArg(command) ? `/${command.name} ` : `/${command.name}`;
}
/** The question a command stands for, or null when it is an action for the app to run. */
export function commandAsk(parsed) {
    return parsed && "command" in parsed && parsed.command.ask ? parsed.command.ask(parsed.arg) : null;
}
export function createCommands(list, groups = {}) {
    const byName = new Map();
    for (const command of list) {
        for (const name of [command.name, ...(command.aliases ?? [])]) {
            const key = name.toLowerCase();
            if (byName.has(key))
                throw new Error(`Two commands are named /${key}`);
            byName.set(key, command);
        }
    }
    const usable = (command, ctx) => !command.when || (ctx !== undefined && command.when(ctx));
    return {
        list,
        groups,
        usable,
        parse(text) {
            const match = /^\/(\S*)\s*(.*)$/s.exec(text.trim());
            if (!match)
                return null;
            const command = byName.get(match[1].toLowerCase());
            return command ? { command, arg: match[2].trim() } : { unknown: match[1] };
        },
        matches(text, ctx, limit = 10) {
            const match = /^\/(\S*)$/.exec(text.trimStart());
            if (!match)
                return [];
            const typed = match[1].toLowerCase();
            const offered = list.filter((command) => usable(command, ctx));
            // "/" alone: the everyday few, or all of them when none are marked core. Typing narrows across all.
            if (!typed)
                return (offered.some((command) => command.core) ? offered.filter((command) => command.core) : offered).slice(0, limit);
            const starts = offered.filter((command) => [command.name, ...(command.aliases ?? [])].some((name) => name.toLowerCase().startsWith(typed)));
            const words = offered.filter((command) => !starts.includes(command) && typed.length >= 2 && command.help.toLowerCase().split(/\W+/).some((word) => word.startsWith(typed)));
            const rank = (command) => (command.name.toLowerCase() === typed ? 2 : command.core ? 1 : 0);
            return [...starts.sort((a, b) => rank(b) - rank(a)), ...words].slice(0, limit);
        },
    };
}
