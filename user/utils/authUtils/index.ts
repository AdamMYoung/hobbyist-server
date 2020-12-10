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
 * Validates if the request has came from an authorized user/API.
 * @param request Request to validate.
 */
export const isAuthorized = async (request: HttpRequest) => {
    const authorizationHeader = request.headers?.authorization;
    if (!authorizationHeader) {
        return null;
    }

    return await new Promise<object>((resolve) => {
        verify(
            authorizationHeader,
            getKey,
            { algorithms: ['RS256'], audience: process.env.AUTO0_AUDIENCE },
            (_, decoded) => resolve(decoded)
        );
    });
};