import { Context } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import imagemin from 'imagemin';
import imageminJpegtran from 'imagemin-jpegtran';
import imageminPngquant from 'imagemin-pngquant';
import FileType from 'file-type';

import { ImageUpload } from '../../types';

const client = BlobServiceClient.fromConnectionString(process.env.BLOB_STORAGE_CONNECTION_STRING);

export const uploadImage = async (upload: ImageUpload, context: Context): Promise<string> => {
    const containerClient = client.getContainerClient(upload.storageLocation);
    await containerClient.createIfNotExists();

    const imageBuffer = Buffer.from(upload.base64Image, 'base64');
    const fileType = await FileType.fromBuffer(imageBuffer);

    const blobName = `img-${encodeURIComponent(new Date().toISOString())}.${fileType.ext}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const minifiedImage = await imagemin.buffer(imageBuffer, {
        plugins: [
            imageminJpegtran(),
            imageminPngquant({
                quality: [0.6, 0.7],
            }),
        ],
    });

    await blockBlobClient.uploadData(minifiedImage);
    return `https://${process.env.BLOB_STORAGE_ACCOUNT}.blob.core.windows.net/${upload.storageLocation}/${blobName}`;
};
