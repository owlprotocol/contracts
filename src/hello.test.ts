import { assert } from 'chai';
import hello from './hello';

describe('hello', function () {

    before(async () => {
    });

    beforeEach(async () => {
    });

    it('hello()', async () => {
        assert.equal(hello(), 'Hello World!')
    });

    it('hello(Bob)', async () => {
        assert.equal(hello('Bob'), 'Hello Bob!')
    });
});
