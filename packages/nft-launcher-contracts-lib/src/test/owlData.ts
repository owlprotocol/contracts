import { SpecieMetadata, SpecieTrait } from '../metadata';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import { writeFileSync } from 'fs';
import { json } from 'stream/consumers';

const client = ipfsHttpClient({
    url: 'https://ipfs.infura.io:5001/api/v0',
});

const owlEyes = { value_name: 'eyes', image: 'http://localhost:3000/Eyes.svg' };
const owlBeak = { value_name: 'beak', image: 'http://localhost:3000/Beak.svg' };
const owlFace = { value_name: 'face', image: 'http://localhost:3000/Face.svg' };
const owlHead = { value_name: 'head', image: 'http://localhost:3000/Head.svg' };
const owlEars = { value_name: 'ears', image: 'http://localhost:3000/Ears.svg' };
const owlWings = { value_name: 'wings', image: 'http://localhost:3000/Wings.svg' };
const owlFeathers = { value_name: 'feathers', image: 'http://localhost:3000/Feathers.svg' };
const owlBg = { value_name: 'background', image: 'http://localhost:3000/Background.svg' };

const eyesTrait = new SpecieTrait('Eyes', 'Image', [
    owlEyes,
    owlEyes,
    owlEyes,
    owlEyes,
    owlEyes,
    owlEyes,
    owlEyes,
    owlEyes,
    owlEyes,
    owlEyes,
    owlEyes,
    owlEyes,
    owlEyes,
    owlEyes,
    owlEyes,
    owlEyes,
]);
const beakTrait = new SpecieTrait('Beak', 'Image', [
    owlBeak,
    owlBeak,
    owlBeak,
    owlBeak,
    owlBeak,
    owlBeak,
    owlBeak,
    owlBeak,
    owlBeak,
    owlBeak,
    owlBeak,
    owlBeak,
    owlBeak,
    owlBeak,
    owlBeak,
    owlBeak,
]);
const faceTrait = new SpecieTrait('Face', 'Image', [
    owlFace,
    owlFace,
    owlFace,
    owlFace,
    owlFace,
    owlFace,
    owlFace,
    owlFace,
    owlFace,
    owlFace,
    owlFace,
    owlFace,
    owlFace,
    owlFace,
    owlFace,
    owlFace,
]);
const headTrait = new SpecieTrait('Head', 'Image', [
    owlHead,
    owlHead,
    owlHead,
    owlHead,
    owlHead,
    owlHead,
    owlHead,
    owlHead,
    owlHead,
    owlHead,
    owlHead,
    owlHead,
    owlHead,
    owlHead,
    owlHead,
    owlHead,
]);
const earsTrait = new SpecieTrait('Ears', 'Image', [
    owlEars,
    owlEars,
    owlEars,
    owlEars,
    owlEars,
    owlEars,
    owlEars,
    owlEars,
    owlEars,
    owlEars,
    owlEars,
    owlEars,
    owlEars,
    owlEars,
    owlEars,
    owlEars,
]);
const wingsTrait = new SpecieTrait('Wings', 'Image', [
    owlWings,
    owlWings,
    owlWings,
    owlWings,
    owlWings,
    owlWings,
    owlWings,
    owlWings,
    owlWings,
    owlWings,
    owlWings,
    owlWings,
    owlWings,
    owlWings,
    owlWings,
    owlWings,
]);
const feathersTrait = new SpecieTrait('Feathers', 'Image', [
    owlFeathers,
    owlFeathers,
    owlFeathers,
    owlFeathers,
    owlFeathers,
    owlFeathers,
    owlFeathers,
    owlFeathers,
    owlFeathers,
    owlFeathers,
    owlFeathers,
    owlFeathers,
    owlFeathers,
    owlFeathers,
    owlFeathers,
    owlFeathers,
]);
const bgTrait = new SpecieTrait('Background', 'Image', [
    owlBg,
    owlBg,
    owlBg,
    owlBg,
    owlBg,
    owlBg,
    owlBg,
    owlBg,
    owlBg,
    owlBg,
    owlBg,
    owlBg,
    owlBg,
    owlBg,
    owlBg,
    owlBg,
]);

const colorRange = { min: 0, max: 256 };

const strokeColor = new SpecieTrait('stroke_color', 'color', colorRange);
const eyeLeftColor = new SpecieTrait('eye_left_color', 'color', colorRange);
const eyeRightColor = new SpecieTrait('eye_right_color', 'color', colorRange);
const beakColor = new SpecieTrait('beak_color', 'color', colorRange);
const faceLeftColor = new SpecieTrait('face_left_color', 'color', colorRange);
const faceRightColor = new SpecieTrait('face_right_color', 'color', colorRange);
const headColor = new SpecieTrait('head_color', 'color', colorRange);
const earLeftColor = new SpecieTrait('ear_left_color', 'color', colorRange);
const earRightColor = new SpecieTrait('ear_right_color', 'color', colorRange);
const wingLeftColor = new SpecieTrait('wing_left_color', 'color', colorRange);
const wingRightColor = new SpecieTrait('wing_right_color', 'color', colorRange);
const feathersColor1 = new SpecieTrait('feathers_color_1', 'color', colorRange);
const feathersColor2 = new SpecieTrait('feathers_color_2', 'color', colorRange);
const feathersColor3 = new SpecieTrait('feathers_color_3', 'color', colorRange);
const bgColor = new SpecieTrait('bg_color', 'color', colorRange);

const metadata = new SpecieMetadata([
    bgTrait,
    feathersTrait,
    wingsTrait,
    earsTrait,
    headTrait,
    faceTrait,
    beakTrait,
    eyesTrait,
    strokeColor,
    bgColor,
    feathersColor1,
    feathersColor2,
    feathersColor3,
    wingLeftColor,
    wingRightColor,
    earLeftColor,
    earRightColor,
    headColor,
    faceLeftColor,
    faceRightColor,
    beakColor,
    eyeLeftColor,
    eyeRightColor,
]);

writeFileSync('./src/owlMetadata.json', JSON.stringify(metadata.getJsonMetadata()));

(async () => {
    const { cid } = await client.add(JSON.stringify(metadata.getJsonMetadata()));
    console.log(cid);
})();

const uploadedIPFSHash = 'QmQqQapxfJUfLd3z4vVqqufDDya29xWq94co1gMFUraLvr';
