import axios from 'axios';

export type ImageUpload = {
    base64Image: string;
    storageLocation: 'profile' | 'post' | 'hobby';
};

export const uploadImage = async (upload: ImageUpload): Promise<string> => {
    return await axios.post(process.env.UPLOAD_FUNCTION_URL, upload).then((res) => res.data.url);
};
