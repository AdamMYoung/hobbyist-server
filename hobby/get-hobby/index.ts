import { AzureFunction, Context } from '@azure/functions';
import { Hobby, HobbyCosmosResult } from '../types';
import { cosmos } from '../utils';
import { withAuth } from '../utils/authUtils';

const httpTrigger: AzureFunction = withAuth(
    { isTokenRequired: false },
    async (context: Context, _, token): Promise<void> => {
        const hobbySlug = context.req.query.slug;
        const hobbyContainer = await cosmos.getHobbiesContainer();

        const hobbyQuery = await hobbyContainer.items
            .query<HobbyCosmosResult>({
                query:
                    'SELECT c.slug, c.name, c.description, c.profileSrc, c.bannerSrc, c["followers"] FROM c WHERE c.slug = @hobbySlug',
                parameters: [{ name: '@hobbySlug', value: hobbySlug }],
            })
            .fetchAll();

        const fetchedHobby = hobbyQuery.resources[0];

        if (!fetchedHobby) {
            context.res = { status: 404 };
            return;
        }

        const hobby: Hobby = {
            slug: fetchedHobby.slug,
            name: fetchedHobby.name,
            description: fetchedHobby.description,
            profileSrc: fetchedHobby.profileSrc,
            bannerSrc: fetchedHobby.bannerSrc,
            following: token ? fetchedHobby.followers?.includes(token.sub) : false,
        };

        context.res = {
            body: hobby,
        };
    }
);

export default httpTrigger;
