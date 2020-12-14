import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { model } from '../utils';
import { uploadImage } from '../utils/storageUtils';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    if (!model.isImageUpload(req.body)) {
        context.res = { status: 400 };
        return;
    }

    const filePath = uploadImage(req.body);

    context.res = {
        status: 201,
        body: filePath,
    };
};

export default httpTrigger;
