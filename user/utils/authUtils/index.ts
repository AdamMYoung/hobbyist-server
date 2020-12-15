import { Context, HttpRequest } from '@azure/functions';
import { verify } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { auth } from '..';
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

/**
 *
 * @param scopes Scopes to authenticate against.
 * @param modelValidator Function used to validate the incoming model. Can be null to bypass.
 * @param func Function to call if validation is successful.
 */
export function withAuth<T>(
    scopes: string[],
    modelValidator: (model: any) => boolean,
    func: (context: Context, model?: T, token?: AccessToken) => Promise<void>
) {
    return async (context: Context, req: HttpRequest) => {
        const token = await auth.isAuthorized(req, context);
        const hasScopes = auth.hasRequiredScopes(token, scopes);

        //User is valid to perform the required operation.
        if (!token || !hasScopes) {
            context.res = { status: 401 };
            return;
        }

        if (modelValidator) {
            if (!modelValidator(req.body)) {
                context.res = { status: 400 };
                return;
            }
        }

        return await func(context, req.body, token);
    };
}
