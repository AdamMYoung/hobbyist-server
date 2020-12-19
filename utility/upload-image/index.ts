import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { model } from '../utils';
import { uploadImage } from '../utils/storageUtils';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    if (!model.isImageUpload(req.body)) {
        context.res = { status: 400 };
        return;
    }

    const filePath = await uploadImage(req.body, context);

    if(!filePath) {
        context.res = {500};
        return;
    }

    context.res = {
        status: 201,
        body: { url: filePath },
    };
};

export default httpTrigger;
