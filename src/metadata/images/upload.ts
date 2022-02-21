import { create as ipfsHttpClient } from 'ipfs-http-client';
import { AddResult, ERC721Metadata, ERC721UploadOptions } from '../types';

const client = ipfsHttpClient({
    url: 'https://ipfs.infura.io:5001/api/v0',
});

export function uploadImage(image: Uint8Array): Promise<AddResult> {
    return client.add(image);
}

export function uploadImageWrapWithDir(path: string, image: Uint8Array): Promise<AddResult> {
    return client.add({ path, content: image }, { wrapWithDirectory: true });
}

/**
 *
 * @param metadata
 * @param options wrapWithDirectory option false by default
 *                image can either be uploaded by developer or the binary can be passed into options
 * @returns
 */
export async function uploadERC721Single(metadata: ERC721Metadata, options?: ERC721UploadOptions): Promise<AddResult> {
    let cid, image, wrapWithDirectory, path;
    if (options) ({ image, wrapWithDirectory, path } = options);

    //if image field provided, upload image to ipfs
    if (image) {
        ({ cid } = await uploadImage(image));
        metadata['image'] = `ipfs://${cid}`;
    }

    if (wrapWithDirectory) {
        if (path) return client.add({ path, content: JSON.stringify(metadata) }, { wrapWithDirectory: true });
        else throw new Error('path option cannot be undefined if wrapWithDirectory is set to true');
    } else return client.add(JSON.stringify(metadata));
}

/**
 *
 * @param metadataList each image must be uplaoded beforehand to form the metadata
 */
export async function uploadERC721Many(metadataList: ERC721Metadata[], pathField: keyof ERC721Metadata) {
    return client.addAll(
        //@ts-ignore
        metadataList.map((m) => {
            return { path: m[pathField], content: JSON.stringify(m) };
        }),
        { wrapWithDirectory: true },
    );
}
