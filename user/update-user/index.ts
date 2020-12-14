import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { UserProfileCosmosResult } from '../types';
import { cosmos, model, auth } from '../utils';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const token = await auth.isAuthorized(req, context);
    const hasScopes = auth.hasRequiredScopes(token, ['update:user_profile']);

    //User is valid to perform the required operation.
    if (!token || !hasScopes) {
        context.res = { status: 401 };
        return;
    }

    //Payload is a valid model.
    if (!model.isUserProfile(req.body)) {
        context.res = { status: 400 };
        return;
    }

    const userContainer = await cosmos.getUsersContainer();
    const userEntry = await userContainer.items
        .query<UserProfileCosmosResult>({
            query: `SELECT 1 FROM c WHERE userId = @userId`,
            parameters: [{ name: '@userId', value: token.sub }],
        })
        .fetchAll();

    const updatedUserEntry = { ...userEntry.resources[0], ...req.body };
    const insertedEntry = await userContainer.items.upsert(updatedUserEntry);

    context.res = {
        status: 201,
        body: insertedEntry.resource,
    };
};

export default httpTrigger;
