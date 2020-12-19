import { AzureFunction, Context } from '@azure/functions';
import { cosmos, image } from '../utils';
import { CreateHobbyRequest, HobbyDetail } from '../types';
import { withAuth } from '../utils/authUtils';

const httpTrigger: AzureFunction = withAuth<CreateHobbyRequest>(
    { isTokenRequired: false },
    async (context: Context, body, token) => {
        const hobbySlug = encodeURIComponent(body.slug);

        const hobbyContainer = await cosmos.getHobbiesContainer();
        const hobbyExists = await hobbyContainer.items
            .query({
                query: 'SELECT VALUE count(c.id) FROM c WHERE c.slug = @hobbySlug',
                parameters: [{ name: '@hobbySlug', value: hobbySlug }],
            })
            .fetchAll();

        if (hobbyExists.resources[0] !== 0) {
            context.res = { status: 409 };
            return;
        }

        const profileSrc = await image.uploadImage({ base64Image: body.profileImgBase64, storageLocation: 'hobby' });
        const bannerSrc = await image.uploadImage({ base64Image: body.bannerImgBase64, storageLocation: 'hobby' });

        const newHobby: HobbyDetail = {
            slug: hobbySlug,
            name: body.name,
            description: body.description,
            profileSrc,
            bannerSrc,
            admins: [token.sub],
        };

        await hobbyContainer.items.create<HobbyDetail>(newHobby);

        context.res = {
            status: 201,
            body: newHobby,
        };
    }
);

export default httpTrigger;
