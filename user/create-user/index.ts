import { AzureFunction, Context } from '@azure/functions';
import { Auth0UserProfile } from '../types';
import { cosmos, model } from '../utils';
import { withAuth } from '../utils/authUtils';

const createProfile: AzureFunction = withAuth<Auth0UserProfile>(
    { scopes: ['create:profile'], modelValidator: model.isAuth0UserProfile },
    async (context: Context, user, token) => {
        const userContainer = await cosmos.getUsersContainer();
        await userContainer.items.create(user);

        context.res = {
            status: 201,
            body: user,
        };
    }
);

export default createProfile;
