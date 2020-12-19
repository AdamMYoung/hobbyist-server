import { Context } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { v3 } from 'uuid';
import imagemin from 'imagemin';
import imageminJpegtran from 'imagemin-jpegtran';
import imageminPngquant from 'imagemin-pngquant';
import { fromBuffer } from 'file-type';

import { ImageUpload } from '../../types';

const client = BlobServiceClient.fromConnectionString(process.env.BLOB_STORAGE_CONNECTION_STRING);

export const uploadImage = async (upload: ImageUpload, context: Context): Promise<string> => {
    const containerClient = client.getContainerClient(upload.storageLocation);
    await containerClient.createIfNotExists();

    const base64String = upload.base64Image.split(',')[1];

    const imageBuffer = Buffer.from(base64String, 'base64');
    const fileType = await fromBuffer(Buffer.from(base64String, 'base64'));

    const blobName = `img-${v3()}.${fileType.ext}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // const minifiedImage = await imagemin.buffer(imageBuffer, {
    //     plugins: [
    //         imageminJpegtran(),
    //         imageminPngquant({
    //             quality: [0.6, 0.7],
    //         }),
    //     ],
    // });

    await blockBlobClient.uploadData(imageBuffer);
    return `https://${process.env.BLOB_STORAGE_ACCOUNT}.blob.core.windows.net/${upload.storageLocation}/${blobName}`;
};
