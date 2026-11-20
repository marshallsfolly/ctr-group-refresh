/**
 * Questions asked in this browser, newest first: Up and Down walk them in the box, as in a shell,
 * and the empty box offers the latest few. Kept in localStorage only, and never required: a private
 * window or blocked storage just means no history.
 */
export function createHistory(key = "jevbar-history", max = 100) {
    const all = () => {
        try {
            const list = JSON.parse(globalThis.localStorage?.getItem(key) ?? "[]");
            return Array.isArray(list) ? list.filter((item) => typeof item === "string") : [];
        }
        catch {
            return [];
        }
    };
    return {
        all,
        recent: (n = 5) => all().slice(0, n),
        remember(text) {
            const clean = text.trim();
            if (!clean)
                return;
            try {
                globalThis.localStorage?.setItem(key, JSON.stringify([clean, ...all().filter((item) => item !== clean)].slice(0, max)));
            }
            catch {
                // History is a convenience only.
            }
        },
        clear() {
            try {
                globalThis.localStorage?.removeItem(key);
            }
            catch {
                // Nothing to clear.
            }
        },
    };
}
