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
const isAuthorized = async (request: HttpRequest, context: Context): Promise<AccessToken | null> => {
    const authorizationHeader = request.headers?.authorization;

    if (!authorizationHeader) {
        return null;
    }

    const token = authorizationHeader.split(' ')[1];

    return await new Promise<AccessToken | null>((resolve) => {
        verify(token, getKey, { algorithms: ['RS256'], audience: process.env.AUTH0_AUDIENCE }, (err, decoded) => {
            if (err) {
                context.log('Failed to decode token.');
                context.log('Trace:', err);
            }

            resolve(decoded === null ? null : (decoded as AccessToken));
        });
    });
};

/**
 * Checks if the passed token contains the required scopes.
 * @param token Token to check scopes against.
 * @param scopes Scopes to check for.
 */
const hasRequiredScopes = (token: AccessToken, scopes: string[]) => {
    if (!token || !token?.scope) {
        return false;
    }

    scopes.forEach((scope) => {
        if (token.scope.includes(scope) === false) {
            return false;
        }
    });

    return true;
};

type AuthOptions = {
    scopes: string[];
    modelValidator: (model: any) => boolean;
    isTokenRequired: boolean;
};

const AuthDefaults: AuthOptions = {
    scopes: [],
    modelValidator: null,
    isTokenRequired: true,
};

/**
 *
 * @param scopes Scopes to authenticate against.
 * @param modelValidator Function used to validate the incoming model. Can be null to bypass.
 * @param func Function to call if validation is successful.
 */
export function withAuth<T>(
    options: Partial<AuthOptions>,
    func: (context: Context, model?: T, token?: AccessToken) => Promise<void>
) {
    return async (context: Context, req: HttpRequest) => {
        const { scopes, modelValidator, isTokenRequired } = { ...AuthDefaults, ...options };

        const token = await isAuthorized(req, context);
        const hasScopes = hasRequiredScopes(token, scopes);

        //User is valid to perform the required operation.
        if ((isTokenRequired && !token) || !hasScopes) {
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
