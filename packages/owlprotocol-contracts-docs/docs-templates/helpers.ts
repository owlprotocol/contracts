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
const re = /{([\-#a-zA-Z0-9_]*)}/gm;
const path = './'; // todo - set this somewhere else
export function formatLinks(this: unknown, opts: HelperOptions) {
    // Render our text
    let rendered = opts.fn(this as unknown, opts);
    // Find all occurrences
    const matches = rendered.match(re);
    if (!matches) return rendered;

    // Iterate through links and format
    for (const match of matches) {
        // {ContractA#mint} => ContractA#mint
        let name = match.slice(1, match.length - 1);

        // Standardize how it's formatted
        // {ContractA-mint} => {ContractA#Mint}
        if (name.includes('-')) name = name.replace('-', '#');

        const link = getLink(name, path);

        // Set md link and update
        rendered = rendered.replace(match, link);

        console.log(`Generated \n${link}\nfrom\n${match}\n`);

    }

    return rendered;
}

/**
 * Returns displayName and resource for a given artifact name
 */
function getLink(name: string, path: string) {

    let displayName = name;
    let resource = name;
    let link = '';

    // i.e. {Contract#Ingredient}
    if (!isLocal(name)) {
        // ContractA#mint => Contract.mint(...)
        displayName = displayName.replace('#', '.');

        // Check if we're referencing a Type or a function
        // ref = 'CrafterMint#deposit'.split('#') => ['CrafterMint', 'Deposit']
        const ref = name.split('#');
        if (ref.length >= 2 && isFunction(ref[1]))
            // Add function indicator
            displayName += '(...)';
        else if (ref.length >= 2 && !isFunction(ref[1])) {
            // Drop the casing for first letter (anchors generate camelCase)
            // ref = Ingredient => ingredient
            ref[1] = ref[1][0].toLowerCase() + ref[1].slice(1);
            // Put string back together
            name = ref.join('#');
        }

        // Generate link
        link = `[\`${displayName}\`](${path}${name})`;

    } else if (isLocal(name)) {
        // Setup HTML anchors
        // local funcs will always start with lower case
        if (isFunction(name))
            // Add function indicator to display
            displayName += '(...)';

        link = `[\`${displayName}\`](#${resource})`;
    }

    return link;

}

/**
 * Determines whether a specified text string is referencing a local function or
 * a separate contract.
 * {Contract#function} is not local
 * {function} is local
 */
function isFunction(name: string) {
    return (!name.includes('#') && name.length > 0 && name[0] == name[0].toLowerCase());
}

// Cannot differentiate local functions from local
// function isType(name: string) {
//     // return (!name.includes('#') && name.length > 0 && name[0] == name[0].toUpperCase());
//     // You can link
//     return false;
// }

function isLocal(name: string) {
    return (isFunction(name) /*|| isType(name) */);
}
