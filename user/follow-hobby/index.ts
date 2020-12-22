import { AzureFunction, Context } from '@azure/functions';
import { HobbyCosmosResult, UserProfileCosmosResult } from '../types';
import { cosmos } from '../utils';
import { withAuth } from '../utils/authUtils';

const followHobby: AzureFunction = withAuth(null, async (context: Context, _, token) => {
    const hobbySlug = context.req.query.slug;

    const userContainer = await cosmos.getUsersContainer();
    const hobbyContainer = await cosmos.getHobbiesContainer();

    const { resources: users } = await userContainer.items
        .query<UserProfileCosmosResult>(
            {
                query: 'SELECT TOP 1 * FROM c WHERE c["userId"] = @userId',
                parameters: [{ name: '@userId', value: token.sub }],
            },
            { partitionKey: 'userId' }
        )
        .fetchAll();
    const user = users[0];

    const { resources: hobbies } = await hobbyContainer.items
        .query<HobbyCosmosResult>(
            {
                query: 'SELECT TOP 1 * FROM c WHERE c["slug"] = @hobbySlug',
                parameters: [{ name: '@hobbySlug', value: hobbySlug }],
            },
            { partitionKey: 'slug' }
        )
        .fetchAll();
    const hobby = hobbies[0];

    if (!user.following.includes(hobby.id)) {
        user.following.push(hobby.id);
        await userContainer.item(user.id).replace(user);
    }

    if (!hobby.followers.includes(token.sub)) {
        hobby.followers.push(token.sub);
        await hobbyContainer.item(hobby.id).replace(hobby);
    }

    context.res = { status: 200 };
});

export default followHobby;
