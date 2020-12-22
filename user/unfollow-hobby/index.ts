import { AzureFunction, Context } from '@azure/functions';
import { HobbyCosmosResult, UserProfileCosmosResult } from '../types';
import { cosmos } from '../utils';
import { withAuth } from '../utils/authUtils';

const unfollowHobby: AzureFunction = withAuth(null, async (context: Context, _, token) => {
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

    if (!user) {
        context.res = {
            status: 404,
            body: `User not found. User UID: ${token.sub}`,
        };
    }

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

    if (!hobby) {
        context.res = {
            status: 404,
            body: `Hobby not found. Hobby slug: ${hobbySlug}`,
        };
    }

    if (user.following.includes(hobby.id)) {
        user.following.splice(user.following.indexOf(hobby.id), 1);
        await userContainer.item(user.id).replace(user);
    }

    if (hobby.followers.includes(token.sub)) {
        hobby.followers.splice(hobby.followers.indexOf(token.sub), 1);
        await hobbyContainer.item(hobby.id).replace(hobby);
    }

    context.res = { status: 200 };
});

export default unfollowHobby;
