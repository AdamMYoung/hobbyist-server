import { Context, HttpRequest } from '@azure/functions';
import { verify } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { AccessToken } from '../../types';

const client = jwksClient({
    jwksUri: process.env.JWKS_URI,
});

const getKey = (header, callback) => {
    client.getSigningKey(header.kid, (err, key) => {
        var signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
};

/**
 * Validates if the request has came from an authorized user.
 * @param request Request to validate.
 */
export const isAuthorized = async (request: HttpRequest, context: Context): Promise<AccessToken | null> => {
    const authorizationHeader = request.headers?.authorization.split(' ')[1];

    if (!authorizationHeader) {
        return null;
    }

    return await new Promise<AccessToken | null>((resolve) => {
        verify(
            authorizationHeader,
            getKey,
            { algorithms: ['RS256'], audience: process.env.AUTH0_AUDIENCE },
            (err, decoded) => {
                if (err) {
                    context.log('Failed to decode token.');
                    context.log('Trace:', err);
                }

                resolve(decoded === null ? null : (decoded as AccessToken));
            }
        );
    });
};

/**
 * Checks if the passed token contains the required scopes.
 * @param token Token to check scopes against.
 * @param scopes Scopes to check for.
 */
export const hasRequiredScopes = (token: AccessToken, scopes: string[]) => {
    if (!token?.scope) {
        return false;
    }

    scopes.forEach((scope) => {
        if (token.scope.includes(scope) === false) {
            return false;
        }
    });

    return true;
};
