import { SpecieMetadata, SpecieTrait } from '../metadata';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import { writeFileSync } from 'fs';

const client = ipfsHttpClient({
    // url: 'https://ipfs-api.istio.owlprotocol.xyz/',
    url: 'https://ipfs.infura.io:5001/api/v0',
    headers: {
        Authorization: `Basic ${Buffer.from('24sx5RWzYCzRK8rKIkxyTw4jAIP:9b8fa3e12bc3b1f146f1463412e90f8c').toString(
            'base64',
        )}`,
    },
});

const owlEyes = {
    value_name: 'eyes',
    image: 'https://raw.githubusercontent.com/owlprotocol/owls/master/800x800/templates/Eyes.svg',
};
const owlBeak = {
    value_name: 'beak',
    image: 'https://raw.githubusercontent.com/owlprotocol/owls/master/800x800/templates/Beak.svg',
};
const owlFace = {
    value_name: 'face',
    image: 'https://raw.githubusercontent.com/owlprotocol/owls/master/800x800/templates/Face.svg',
};
const owlHead = {
    value_name: 'head',
    image: 'https://raw.githubusercontent.com/owlprotocol/owls/master/800x800/templates/Head.svg',
};
const owlEars = {
    value_name: 'ears',
    image: 'https://raw.githubusercontent.com/owlprotocol/owls/master/800x800/templates/Ears.svg',
};
const owlWings = {
    value_name: 'wings',
    image: 'https://raw.githubusercontent.com/owlprotocol/owls/master/800x800/templates/Wings.svg',
};
const owlFeathers = {
    value_name: 'feathers',
    image: 'https://raw.githubusercontent.com/owlprotocol/owls/master/800x800/templates/Feathers.svg',
};
const owlBg = {
    value_name: 'background',
    image: 'https://raw.githubusercontent.com/owlprotocol/owls/master/800x800/templates/Background.svg',
};

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

const tokenIds = [
    '15532881770934585726362572820003503218105251610',
    '22669120234464385131654002667250978900018984730',
    '11251138692816706083187714911655017808957011738',
    '5542147921992866558954571033857037263426025242',
    '23739556003993855042447717144338100252306044698',
    '23025931936180581485115997338265290227201491226',
    '29448546774817694566680861022136080797837031194',
    '35157537545641534090914004899934061343368017690',
    '40866528316465373615147148777732041888899004186',
    '45861895240936232901745540205708751110725437210',
    '36448135759694681259251134797978370311',
    '8582483063670310957137754735029461492944234268',
    '5157506740148479691781772203068285322403879503',
    '5157088601176007242597874075190452610810514818',
    '9129088601176007242597874075198452610810514818',
    '364888601176104842597874075059252610810514818',
    '957488646556104842597874075059772610810514818',
    '122896646556104842597874075059772610810514818',
    '122896646582946842597874076733772610810512918',
    '889096645721946842597874076733772610810512918',
    '23739556003172555042447717144338100252306044698',
    '23739486003172555042447123434338100252306044698',
    '23739709014372513443567123434338100149467604469',
    '6792345560039938550424477171443381002523060446',
    '2359260399385512748971443381002523060446',
    '29448546774817692666680861022136080797837031194',
    '28448546777917692694680861142513601467978370311',
    '36448546777917692694680861142513601467978370311',
    '364481357596946812592513601467978370311',
    '40866368316465373615147148777737094388889900418',
    '40861468316465373615112448736773709438868990041',
    '12456146823136112413624487123556870944587',
    '40866528316465377834147148779432041888899004186',
    '356811923176489970264571455468749168294170912',
    '35681192317625410264571455468749168294170912',
    '35621117317625410264571455461536168294170000',
    '00928572687411919269571455981996118294170000',
    '0092857268742222926957179308199611829417000013',
    '009285710874222292600011104219998918281911000',
    '129985790911010292600011104219998918281911000',
    '705029790911010292120011104210011118281911000',
    '199929790911010180980011104210011118281911000',
    '000000090911010990980011104210011110000000000',
    '000000099911010990980011104210011110000000000',
    '0000000999211099098001102210011190000000000',
    '1000000999211099098001102210011190000000000',
    '1100000999211099098001102210011190000000000',
    '1110000999211099098001102210011190000000000',
    '1140000999211099098001102210011190000000000',
    '1140000999211081208001102210011190000000000',
    '3010000999211091208000221002190000000000',
    '3012200999211091208000221002190000000000',
    '3204700997211091208000111002190000000000',
];

const nameOverrides: Record<string, string> = {};
tokenIds.forEach((e, i) => {
    nameOverrides[e] = `CryptoOwl #${i + 1}`;
});

const metadata = new SpecieMetadata(
    [
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
    ],
    true,
    {
        name: nameOverrides,
    },
    {
        description: 'The CryptoOwls: nocturnal crypto-mining, nft-gambling degenerates.',
    },
);

writeFileSync('./src/owlMetadata.json', JSON.stringify(metadata.getJsonMetadata()));

(async () => {
    const { cid } = await client.add(JSON.stringify(metadata.getJsonMetadata()));
    console.log(cid);
})();

('QmWLtExLKz2rhrBusBskxpnhrQCPYt6mu9sER4RYAiMjL7');
