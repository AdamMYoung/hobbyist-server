import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { cosmos, model, auth } from '../utils';

const createProfile: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const token = await auth.isApiAuthorized(req);

    if (!token) {
        context.res = { status: 401 };
        return;
    }

    if (!model.isAuth0UserProfile(req.body)) {
        context.res = { status: 400 };
        return;
    }

    //Do things here with the element.
    const user = req.body;
    const userContainer = await cosmos.getUsersContainer();
    const insertedUser = await userContainer.items.create(user);

    context.res = {
        status: 201,
        body: await insertedUser.item.read(),
    };
};

export default createProfile;
