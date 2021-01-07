import { Context } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { fromBuffer } from 'file-type';

import { ImageUpload } from '../../types';
import { getId } from '../stringUtils';
import Jimp from 'jimp';

const client = BlobServiceClient.fromConnectionString(process.env.BLOB_STORAGE_CONNECTION_STRING);

export const uploadImage = async (upload: ImageUpload, context: Context): Promise<string> => {
    const containerClient = client.getContainerClient(upload.storageLocation);
    await containerClient.createIfNotExists();

    const base64String = upload.base64Image.split(',')[1];

    const imageBuffer = Buffer.from(base64String, 'base64');
    const fileType = await fromBuffer(Buffer.from(base64String, 'base64'));

    const blobName = `img-${getId()}.${fileType.ext}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const minifiedImage = await Jimp.read(imageBuffer)
        .then((img) => img.quality(70).getBufferAsync(fileType.mime))
        .catch((error) => context.log(error));

    if (!minifiedImage) {
        return null;
    }

    await blockBlobClient.uploadData(minifiedImage);
    return `https://${process.env.BLOB_STORAGE_ACCOUNT}/${upload.storageLocation}/${blobName}`;
};
