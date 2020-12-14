import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { cosmos, model, auth } from '../utils';
import { hasRequiredScopes } from '../utils/authUtils';

const createProfile: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const token = await auth.isAuthorized(req, context);
    const hasScopes = hasRequiredScopes(token, ['create:profile']);

    if (!token || !hasScopes) {
        context.res = { status: 401 };
        return;
    }

    if (!model.isAuth0UserProfile(req.body)) {
        context.log('Invalid request body');
        context.log(req.body);

        context.res = { status: 400 };
        return;
    }

    //Do things here with the element.
    const user = req.body;
    context.log('Request body: ', user);

    const userContainer = await cosmos.getUsersContainer();
    const insertedUser = await userContainer.items.create(user);

    context.res = {
        status: 201,
        body: user,
    };
};

export default createProfile;
