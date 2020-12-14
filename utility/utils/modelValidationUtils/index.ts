import { ImageUpload } from '../../types';

export function isImageUpload(object: any): object is ImageUpload {
    return 'base64Img' in object && 'storageLocation' in object;
}
