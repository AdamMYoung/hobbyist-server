import { BlobServiceClient } from '@azure/storage-blob';
import base64Img from 'base64-img';

import { ImageUpload } from '../../types';

const client = BlobServiceClient.fromConnectionString(process.env.BLOB_STORAGE_CONNECTION_STRING);

export const uploadImage = async (upload: ImageUpload): Promise<string> => {
    const containerClient = client.getContainerClient(upload.storageLocation);
    await containerClient.createIfNotExists();

    const blobName = 'img-' + encodeURIComponent(new Date().toISOString());
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const image = await new Promise<string>((resolve) => {
        base64Img.img(upload.base64Image, '', blobName, (err, filepath) => resolve(filepath));
    });

    await blockBlobClient.uploadFile(image);
    return `${process.env.BLOB_STORAGE_ACCOUNT}.blob.core.windows.net/${upload.storageLocation}/${blobName}`;
};
