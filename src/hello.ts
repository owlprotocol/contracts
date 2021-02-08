export default function hello(name?: string) {
    return `Hello ${name ?? 'World'}!`
}