export type Auth0UserProfile = {
    userId: string;
    emailAddress: string;
    username: string;
    profileSrc: string;
};

export type UserProfileUpdateRequest = {
    username?: string;
    profileImgBase64?: string;
    bannerImgBase64?: string;
};

//Generic

export type AccessToken = {
    iss: string;
    sub: string;
    aud: string[];
    azp: string;
    exp: number;
    iat: number;
    scope: string;
};

export type CosmosResult = {
    id: string;
    _rid: string;
    _self: string;
    _etag: string;
    _attachments: string;
    _ts: number;
};

export type UserProfileCosmosResult = CosmosResult & {
    userId: string;
    emailAddress: string;
    profileSrc: string;
    username: string;
    bannerSrc?: string;
};
