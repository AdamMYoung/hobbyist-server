import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { getUsersContainer } from '../cosmosDbUtils';
import { Profile } from '../types';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('User-CreateProfile was triggered.');
    const name = req.query.name || (req.body && req.body.name);
    const responseMessage = name
        ? 'Hello, ' + name + '. This HTTP triggered function executed successfully.'
        : 'This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.';

    context.res = {
        status: 201,
        body: responseMessage,
    };
};

export default httpTrigger;
