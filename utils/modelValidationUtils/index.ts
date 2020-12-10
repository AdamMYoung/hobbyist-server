import { Auth0UserProfile } from '../../types';

export function isAuth0UserProfile(object: any): object is Auth0UserProfile {
    return 'emailAddress' in object && 'username' in object && 'profileSrc' in object;
}
