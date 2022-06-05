interface ERC721UploadOptions {
    /** Upload an image for single upload only */
    image?: Uint8Array;
    /** Wrap the file within a diectory */
    wrapWithDirectory?: boolean;
    /** only necessary if wrapWithDirectory is true */
    path?: string;
    /**  */
}

export default ERC721UploadOptions;
