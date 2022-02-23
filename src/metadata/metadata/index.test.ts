import { assert, expect } from 'chai';
import SpecieMetadata, { validateSchema } from './SpecieMetadata';
import SpecieTrait from './SpecieTrait';
import { generateAllInstances, instanceMetadata8 } from './test-results';

describe('metadata.integration', () => {
    let orangeBody, yellowBody, greenBody;

    let smallEyes, mediumEyes, largeEyes;

    let blueMouth, redMouth, pinkMouth;

    let bodyTraits: SpecieTrait, eyeTraits: SpecieTrait, mouthTraits: SpecieTrait;

    let metadata: SpecieMetadata;

    before(() => {
        orangeBody = { value_name: 'orange', image: __dirname + '/testimages/body/orange_body.png' };
        yellowBody = { value_name: 'yellow', image: __dirname + '/testimages/body/yellow_body.png' };
        greenBody = { value_name: 'rectangle', image: __dirname + '/testimages/body/green_body.png' };

        smallEyes = { value_name: 'small', image: __dirname + '/testimages/eyes/eyes_1.png' };
        mediumEyes = { value_name: 'medium', image: __dirname + '/testimages/eyes/eyes_2.png' };
        largeEyes = { value_name: 'large', image: __dirname + '/testimages/eyes/eyes_3.png' };

        blueMouth = { value_name: 'blue', image: __dirname + '/testimages/mouth/mouth_1.png' };
        redMouth = { value_name: 'red', image: __dirname + '/testimages/mouth/mouth_2.png' };
        pinkMouth = { value_name: 'pink', image: __dirname + '/testimages/mouth/mouth_3.png' };

        bodyTraits = new SpecieTrait('Body', 'Image', [orangeBody, yellowBody, greenBody]);
        eyeTraits = new SpecieTrait('Eyes', 'Image', [smallEyes, mediumEyes, largeEyes]);
        mouthTraits = new SpecieTrait('Mouth', 'Image', [blueMouth, redMouth, pinkMouth]);

        //Order in array matters
        metadata = new SpecieMetadata([bodyTraits, eyeTraits, mouthTraits]);
    });

    describe('SpecieMetadata.ts', () => {
        it('getSpecieMetadata', () => {
            assert.deepEqual(metadata.generateAllInstances(), generateAllInstances);
        });

        it('getMaxBitSize', () => {
            const bodyBitSize = Math.ceil(Math.log2(bodyTraits.getAmountofTraits()));
            const eyeBitSize = Math.ceil(Math.log2(eyeTraits.getAmountofTraits()));
            const mouthBitSize = Math.ceil(Math.log2(mouthTraits.getAmountofTraits()));
            assert.equal(metadata.getMaxBitSize(), bodyBitSize + eyeBitSize + mouthBitSize);
        });

        it('dnaToMetadata', () => {
            expect(() => metadata.dnaToMetadata(7)).to.throw('Invalid Dna for this SpecieMetadata');
            assert.deepEqual(instanceMetadata8, metadata.dnaToMetadata(8));
        });
    });

    describe('validate', () => {
        let json: any;

        beforeEach(() => {
            json = metadata.getJsonMetadata();
        });

        it('missing maxBitSize', () => {
            json = { traits: json.traits };
            expect(() => validateSchema(json)).to.throw("must have required property 'maxBitSize'");
        });

        it('missing traits', () => {
            json = { maxBitSize: json.maxBitSize };
            expect(() => validateSchema(json)).to.throw("must have required property 'traits'");
        });

        it('fields not defined in schema should still pass', () => {
            json = { ...json, hello: 'bye' };
            assert.equal(validateSchema(json), true);
        });

        //traits schema
        it('traits is not array', () => {
            json.traits = '';
            expect(() => validateSchema(json)).to.throw('must be array');
        });

        it('object in value_options array not having value or image', () => {
            const json2 = JSON.parse(JSON.stringify(json));
            json2.traits[0].value_options[0] = { value_name: 'Eyes' };
            expect(() => validateSchema(json2)).to.throw(
                "must have required property 'image', must have required property 'value', must match exactly one schema in oneOf",
            );
        });

        it('empty value_options array', () => {
            json.traits[0].value_options = [];
            expect(() => validateSchema(json)).to.throw('must NOT have fewer than 1 items');
        });

        it('value_bit_size between 0 and 256', () => {
            const json2 = JSON.parse(JSON.stringify(json));
            json2.traits[0].value_bit_size = -1;
            expect(() => validateSchema(json2)).to.throw('must be >= 0');
            json2.traits[0].value_bit_size = 257;
            expect(() => validateSchema(json2)).to.throw('must be <= 256');
        });
    });

    describe('SpecieTrait.ts', () => {
        it('bit size', () => {
            const bodyBitSize = Math.ceil(Math.log2(bodyTraits.getAmountofTraits()));
            assert.equal(bodyTraits.getBitSize(), bodyBitSize);
            const eyeBitSize = Math.ceil(Math.log2(eyeTraits.getAmountofTraits()));
            assert.equal(eyeTraits.getBitSize(), eyeBitSize);
            const mouthBitSize = Math.ceil(Math.log2(mouthTraits.getAmountofTraits()));
            assert.equal(mouthTraits.getBitSize(), mouthBitSize);
        });
    });
});
