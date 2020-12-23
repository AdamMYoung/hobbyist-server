import { AzureFunction, Context } from '@azure/functions';
import { Hobby, HobbyCosmosResult, ProfileDetail, UserProfileCosmosResult } from '../types';
import { cosmos } from '../utils';
import { withAuth } from '../utils/authUtils';

const getUser: AzureFunction = withAuth({ isTokenRequired: false }, async (context: Context, _, token) => {
    const username = context.req.query.username;

    const userContainer = await cosmos.getUsersContainer();

    const { resources: users } = await userContainer.items
        .query<UserProfileCosmosResult>({
            query: `SELECT TOP 1 * FROM c WHERE c["username"] = @username`,
            parameters: [{ name: '@username', value: username }],
        })
        .fetchAll();

    if (!users[0]) {
        context.res = {
            status: 404,
            body: `User not found. Username: ${username}`,
        };
        return;
    }

    context.res = {
        status: 200,
        body: {
            profileSrc: users[0].profileSrc,
            bannerSrc: users[0].bannerSrc,
            username: users[0].username,
            description: users[0].description,
        } as ProfileDetail,
    };
});

export default getUser;
