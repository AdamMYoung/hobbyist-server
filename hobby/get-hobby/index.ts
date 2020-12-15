import { AzureFunction, Context } from '@azure/functions';
import { Hobby } from '../types';
import { cosmos } from '../utils';
import { withAuth } from '../utils/authUtils';

const httpTrigger: AzureFunction = withAuth(
    { isTokenRequired: false },
    async (context: Context, _, token): Promise<void> => {
        const hobbyName = context.req.params.name;
        const hobbyContainer = await cosmos.getHobbiesContainer();

        const hobbyQuery = await hobbyContainer.items
            .query<Hobby>({
                query: 'SELECT name, description, profileSrc, bannerSrc FROM c WHERE c.name = @hobbyName LIMIT 1',
                parameters: [{ name: '@hobbyName', value: hobbyName }],
            })
            .fetchAll();

        const hobby: Hobby = {
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
