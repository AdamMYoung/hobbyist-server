import { AzureFunction, Context } from '@azure/functions';
import { UserProfileCosmosResult, UserProfileUpdateRequest } from '../types';
import { cosmos } from '../utils';
import { withAuth } from '../utils/authUtils';
import { uploadImage } from '../utils/imageUtils';

const httpTrigger: AzureFunction = withAuth<UserProfileUpdateRequest>(
    { scopes: ['update:user_profile'] },
    async (context: Context, body, token): Promise<void> => {
        const userContainer = await cosmos.getUsersContainer();
        const userEntry = await userContainer.items
            .query<UserProfileCosmosResult>({
                query: `SELECT TOP 1 * FROM c WHERE c["userId"] = @userId`,
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
    }
);

export default httpTrigger;
