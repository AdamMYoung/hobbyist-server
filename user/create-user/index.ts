import { AzureFunction, Context } from '@azure/functions';
import { Auth0UserProfile, UserProfileCosmosResult } from '../types';
import { cosmos, model } from '../utils';
import { withAuth } from '../utils/authUtils';

const createProfile: AzureFunction = withAuth<Auth0UserProfile>(
    { scopes: ['create:profile'], modelValidator: model.isAuth0UserProfile },
    async (context: Context, user) => {
        const userContainer = await cosmos.getUsersContainer();

        const { resources: users } = await userContainer.items
            .query<UserProfileCosmosResult>({
                query: `SELECT TOP 1 * FROM c WHERE c["userId"] = @userId`,
                parameters: [{ name: '@userId', value: user.userId }],
            })
            .fetchAll();

        if (users?.length > 0) {
            context.res = { status: 404, body: `User already exists. User ID: ${user.userId}` };
            return;
        }

        await userContainer.items.create<Partial<UserProfileCosmosResult>>({
            userId: user.userId,
            emailAddress: user.emailAddress,
            profileSrc: user.profileSrc,
            username: user.username,
            bannerSrc: null,
            following: [],
        });

        context.res = {
            status: 201,
            body: user,
        };
    }
);

export default createProfile;
