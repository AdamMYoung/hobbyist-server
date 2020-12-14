import { Auth0UserProfile, UserProfileUpdateRequest } from '../../types';

export function isAuth0UserProfile(object: any): object is Auth0UserProfile {
    return 'userId' in object && 'emailAddress' in object && 'username' in object && 'profileSrc' in object;
}

export function isUserProfile(object: any): object is UserProfileUpdateRequest {
    return 'username' in object && 'profileSrc' in object && 'bannerSrc' in object;
}
