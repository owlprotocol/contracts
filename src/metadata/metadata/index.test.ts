import { assert, expect } from 'chai';
import SpecieMetadata from './SpecieMetadata';
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
