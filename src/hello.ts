/**
 * @param name
 * @returns Hello World message
 */
export default function hello(name?: string) {
    return `Hello ${name ?? 'World'}!`;
}
