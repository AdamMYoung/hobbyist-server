import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { UserProfileCosmosResult, UserProfileUpdateRequest } from '../types';
import { cosmos, model, auth } from '../utils';
import { uploadImage } from '../utils/imageUtils';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const token = await auth.isAuthorized(req, context);
    const hasScopes = auth.hasRequiredScopes(token, ['update:user_profile']);

    //User is valid to perform the required operation.
    if (!token || !hasScopes) {
        context.res = { status: 401 };
        return;
    }

    const body = req.body as UserProfileUpdateRequest;

    const userContainer = await cosmos.getUsersContainer();
    const userEntry = await userContainer.items
        .query<UserProfileCosmosResult>({
            query: `SELECT * FROM c WHERE userId = @userId`,
            parameters: [{ name: '@userId', value: token.sub }],
        })
        .fetchAll();

    const updatedUserEntry = { ...userEntry.resources[0] };

    if (body.username) {
        updatedUserEntry['username'] = body.username;
    }

    if (body.profileImgBase64) {
        updatedUserEntry['profileSrc'] = await uploadImage({
            base64Image: body.profileImgBase64,
            storageLocation: 'profile',
        });
    }

    if (body.bannerImgBase64) {
        updatedUserEntry['bannerSrc'] = await uploadImage({
            base64Image: body.bannerImgBase64,
            storageLocation: 'profile',
        });
    }

    const insertedEntry = await userContainer.items.upsert(updatedUserEntry);

    context.res = {
        status: 201,
        body: insertedEntry.resource,
    };
};

export default httpTrigger;
