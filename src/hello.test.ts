import { assert } from 'chai';
import { NAME } from './utils/environment';
import hello from './hello';

describe('hello', function () {
    //before(async () => { });

    //beforeEach(async () => { });

    it('hello()', async () => {
        assert.equal(hello(), 'Hello World!');
    });

    it('hello(Bob)', async () => {
        assert.equal(hello('Bob'), 'Hello Bob!');
    });

    it('hello(NAME)', async () => {
        assert.equal(hello(NAME), 'Hello Jane!');
    });
});
