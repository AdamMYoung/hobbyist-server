import { ImageUpload } from '../../types';

export function isImageUpload(object: any): object is ImageUpload {
    return 'base64Image' in object && 'storageLocation' in object;
}
