import { Context, HttpRequest } from '@azure/functions';
import { verify } from 'jsonwebtoken';

/**
 * Validates if the request has came from an authorized user/API.
 * @param request Request to validate.
 */
export const isAuthorized = async (request: HttpRequest) => {
    const authorizationHeader = request.headers?.authorization;
    if (!authorizationHeader) {
        return false;
    }

    return await new Promise<boolean>((resolve, reject) => {
        verify(authorizationHeader, process.env.AUTH0_SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
            return resolve(!!decoded);
        });
    });
};
