import { Context } from '@azure/functions';
import { isAuthorized } from '../authUtils';

/**
 * Validates the current request context.
 * @param context Context to validate.
 */
export const isValidRequest = async (context: Context) => {
    if (!context.req) {
        context.log('Request not found.');
        context.res = { status: 500 };
        return false;
    }

    if (!(await isAuthorized(context.req))) {
        context.log('Request not authorized.');
        context.res = { status: 401 };
        return false;
    }

    return true;
};
