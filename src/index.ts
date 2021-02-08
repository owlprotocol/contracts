import { NAME } from './utils/environment';
import hello from './hello';

function main() {
    console.debug(hello(NAME));
}

if (typeof require !== 'undefined' && require.main === module) {
    main();
}
