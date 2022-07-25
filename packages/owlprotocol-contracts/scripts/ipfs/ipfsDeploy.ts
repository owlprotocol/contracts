//@ts-nocheck
import { create } from 'ipfs-http-client'
import { readFileSync } from 'fs';

(async () => {
    const client = create({ url: "/ip4/127.0.0.1/tcp/5002/http" });

    const imagePaths = []
    for (let i = 0; i < 10; i++) {
        const { path } = await client.add(readFileSync(`${__dirname}/metadata/${i}/image.png`))
        imagePaths.push(path)
    }
    console.log(imagePaths)

    const data = imagePaths.map((e, i) => { return { path: `${i}.json`, content: JSON.stringify({ image: `ipfs://${e}`, ...JSON.parse(readFileSync(`${__dirname}/metadata/${i}/attributes.json`).toString()) }) } })

    const res = client.addAll(
        data, { wrapWithDirectory: true }
    )

    let s = []
    for await (let a of res) {
        s.push(a);
    }

    console.log(`Cid is ${(s[s.length - 1]).cid}`)
}

)()