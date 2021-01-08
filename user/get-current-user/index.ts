import { AzureFunction, Context } from '@azure/functions';
import { CurrentProfileDetail, Hobby, HobbyCosmosResult, ProfileDetail, UserProfileCosmosResult } from '../types';
import { cosmos } from '../utils';
import { withAuth } from '../utils/authUtils';

const getCurrentUser: AzureFunction = withAuth({}, async (context: Context, _, token) => {
    const userContainer = await cosmos.getUsersContainer();

    const { resources: users } = await userContainer.items
        .query<UserProfileCosmosResult>({
            query: `SELECT TOP 1 * FROM c WHERE c["userId"] = @userId`,
            parameters: [{ name: '@userId', value: token.sub }],
        })
        .fetchAll();

    if (!users[0]) {
        context.res = {
            status: 404,
            body: `User not found. User ID: ${token.sub}`,
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
            emailAddress: users[0].emailAddress,
        } as CurrentProfileDetail,
    };
});

export default getCurrentUser;
