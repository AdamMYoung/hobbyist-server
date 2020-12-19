import { AzureFunction, Context } from '@azure/functions';
import { HobbyCosmosResult, UserProfileCosmosResult } from '../types';
import { cosmos } from '../utils';
import { withAuth } from '../utils/authUtils';

const unfollowHobby: AzureFunction = withAuth(null, async (context: Context, _, token) => {
    const hobbySlug = context.req.query.slug;

    const userContainer = await cosmos.getUsersContainer();
    const hobbyContainer = await cosmos.getHobbiesContainer();

    const { resources: users } = await userContainer.items
        .query<UserProfileCosmosResult>({
            query: 'SELECT c.id, c["following"] FROM c WHERE c.userId = @userId',
            parameters: [{ name: '@userId', value: token.sub }],
        })
        .fetchAll();
    const user = users[0];

    const { resources: hobbies } = await hobbyContainer.items
        .query<HobbyCosmosResult>({
            query: 'SELECT c.id, c["followers"] FROM c WHERE c.slug = @hobbySlug',
            parameters: [{ name: '@hobbySlug', value: hobbySlug }],
        })
        .fetchAll();
    const hobby = hobbies[0];

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
