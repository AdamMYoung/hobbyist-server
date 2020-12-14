import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { cosmos, model, auth } from '../utils';

const createProfile: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const token = await auth.isAuthorized(req, context);
    const hasScopes = auth.hasRequiredScopes(token, ['create:profile']);

    if (!token || !hasScopes) {
        context.res = { status: 401 };
        return;
    }

    if (!model.isAuth0UserProfile(req.body)) {
        context.res = { status: 400 };
        return;
    }

    //Do things here with the element.
    const user = req.body;
    context.log('Request body: ', user);

    const userContainer = await cosmos.getUsersContainer();
    await userContainer.items.create(user);

    context.res = {
        status: 201,
        body: user,
    };
};

export default createProfile;
