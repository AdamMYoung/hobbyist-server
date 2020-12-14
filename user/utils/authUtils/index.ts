import { HttpRequest } from '@azure/functions';
import { verify } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
    jwksUri: process.env.JWKS_URI,
});

const getKey = (header, callback) => {
    client.getSigningKey(header.kid, function (err, key) {
        var signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
};

/**
 * Validates if the request has came from an authorized user.
 * @param request Request to validate.
 */
export const isAuthorized = async (request: HttpRequest) => {
    const authorizationHeader = request.headers?.Authorization;
    if (!authorizationHeader) {
        return null;
    }

    return await new Promise<object>((resolve) => {
        verify(
            authorizationHeader,
            getKey,
            { algorithms: ['RS256'], audience: process.env.AUTH0_AUDIENCE },
            (_, decoded) => resolve(decoded)
        );
    });
};

/**
 * Checks if the passed token contains the required scopes.
 * @param token Token to check scopes against.
 * @param scopes Scopes to check for.
 */
export const hasRequiredScopes = (token: any, scopes: string[]) => {
    if (!token.scope) {
        return false;
    }

    scopes.forEach((scope) => {
        if (token.scope.includes(scope) === false) {
            return false;
        }
    });

    return true;
};
