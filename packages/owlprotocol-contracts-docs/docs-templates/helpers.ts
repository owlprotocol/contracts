import { HelperOptions, Utils } from 'handlebars';

// import { TypeName } from 'solidity-ast';
// import { DocItemWithContext } from '../../site';

/**
 * Returns a Markdown heading marker. An optional number increases the heading level.
 *
 *    Input                  Output
 *    {{h}} {{name}}         # Name
 *    {{h 2}} {{name}}       ## Name
 */
export function h(opts: HelperOptions): string;
export function h(hsublevel: number, opts: HelperOptions): string;
export function h(hsublevel: number | HelperOptions, opts?: HelperOptions) {
    const { hlevel } = getHLevel(hsublevel, opts);
    return new Array(hlevel).fill('#').join('');
};

/**
 * Delineates a section where headings should be increased by 1 or a custom number.
 *
 *    {{#hsection}}
 *    {{>partial-with-headings}}
 *    {{/hsection}}
 */
export function hsection(opts: HelperOptions): string;
export function hsection(hsublevel: number, opts: HelperOptions): string;
export function hsection(this: unknown, hsublevel: number | HelperOptions, opts?: HelperOptions) {
    let hlevel;
    ({ hlevel, opts } = getHLevel(hsublevel, opts));
    opts.data = Utils.createFrame(opts.data);
    opts.data.hlevel = hlevel;
    return opts.fn(this as unknown, opts);
}

/**
 * Helper for dealing with the optional hsublevel argument.
 */
function getHLevel(hsublevel: number | HelperOptions, opts?: HelperOptions) {
    if (typeof hsublevel === 'number') {
        opts = opts!;
        hsublevel = Math.max(1, hsublevel);
    } else {
        opts = hsublevel;
        hsublevel = 1;
    }
    const contextHLevel: number = opts.data?.hlevel ?? 0;
    return { opts, hlevel: contextHLevel + hsublevel };
}

export function trim(text: string) {
    if (typeof text === 'string') {
        return text.trim();
    }
}

export function joinLines(text?: string) {
    if (typeof text === 'string') {
        return text.replace(/\n+/g, ' ');
    }
}

// Regular expression -> match all function names, contract names, and # to separate
const re = /{{([ #a-zA-Z0-9_]*)}}/gm;
const path = './'; // todo - set this somewhere else
export function formatLinks(this: unknown, opts: HelperOptions) {
    // Render our text
    let rendered = opts.fn(this as unknown, opts);
    // Find all occurances
    const matches = rendered.match(re);
    if (!matches) return rendered;

    // Iterate through links and format
    for (const match of matches) {
        // {{ContractA#mint}} => ContractA#mint
        const name = match.slice(2, match.length - 2);

        // ContractA#mint => Contract.mint(...)
        let displayName = name;
        if (displayName.includes('#')) displayName = displayName.replace('#', '.') + '(...)';

        // Set md link and update
        const link = `[${displayName}](${path}${name})`;
        rendered = rendered.replace(match, link);
    }

    return rendered;
}
