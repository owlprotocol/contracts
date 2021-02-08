import dotenv from 'dotenv';
import hello from './hello'

if (process.env.NODE_ENV == 'development') {
    dotenv.config();
}

function main() {
    const NAME = process.env.NAME || 'world';

    console.debug(hello(NAME ?? undefined));
}

main();
