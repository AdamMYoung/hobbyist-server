import { AzureFunction, Context } from '@azure/functions';
import { Hobby } from '../types';
import { cosmos } from '../utils';
import { withAuth } from '../utils/authUtils';

const httpTrigger: AzureFunction = withAuth(
    { isTokenRequired: false },
    async (context: Context, _, token): Promise<void> => {
        const hobbySlug = context.req.params.slug;
        const hobbyContainer = await cosmos.getHobbiesContainer();

        const hobbyQuery = await hobbyContainer.items
            .query<Hobby>({
                query: 'SELECT name, description, profileSrc, bannerSrc FROM c WHERE c.slug = @hobbySlug LIMIT 1',
                parameters: [{ name: '@hobbySlug', value: hobbySlug }],
            })
            .fetchAll();

        const hobby: Hobby = {
            slug: hobbyQuery.resources[0].slug,
            name: hobbyQuery.resources[0].name,
            description: hobbyQuery.resources[0].description,
            profileSrc: hobbyQuery.resources[0].profileSrc,
            bannerSrc: hobbyQuery.resources[0].bannerSrc,
        };

        context.res = {
            body: hobby,
        };
    }
);

export default httpTrigger;
