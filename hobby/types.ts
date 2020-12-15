export type CreateHobbyRequest = {
    name: string;
    description: string;
    profileImgBase64: string;
    bannerImgBase64: string;
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

//Application Types
export type UserProfile = {
    userId: string;
    emailAddress: string;
    profileSrc: string;
    username: string;
    bannerSrc?: string;
};

export type Hobby = {
    name: string;
    description: string;
    profileSrc: string;
    bannerSrc: string;
};

export type HobbyDetail = Hobby & {
    admins: string[];
};

//Cosmos Types
export type CosmosResult = {
    id: string;
    _rid: string;
    _self: string;
    _etag: string;
    _attachments: string;
    _ts: number;
};

export type UserProfileCosmosResult = CosmosResult & UserProfile;
