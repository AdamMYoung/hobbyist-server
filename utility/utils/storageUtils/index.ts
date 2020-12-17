import { BlobServiceClient } from '@azure/storage-blob';
import base64Img from 'base64-img';
import imagemin from 'imagemin';
import imageminJpegtran from 'imagemin-jpegtran';
import imageminPngquant from 'imagemin-pngquant';

import { ImageUpload } from '../../types';

const client = BlobServiceClient.fromConnectionString(process.env.BLOB_STORAGE_CONNECTION_STRING);

export const uploadImage = async (upload: ImageUpload): Promise<string> => {
    const containerClient = client.getContainerClient(upload.storageLocation);
    await containerClient.createIfNotExists();

    const blobName = 'img-' + encodeURIComponent(new Date().toISOString());
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const image = await new Promise<string>((resolve) => {
        base64Img.img(upload.base64Image, '', blobName, (_, filepath) => resolve(filepath));
    });

    const minifiedImage = await imagemin([image], {
        plugins: [
            imageminJpegtran(),
            imageminPngquant({
                quality: [0.6, 0.7],
            }),
        ],
    });

    await blockBlobClient.uploadData(minifiedImage[0].data);
    return `${process.env.BLOB_STORAGE_ACCOUNT}.blob.core.windows.net/${upload.storageLocation}/${blobName}`;
};
