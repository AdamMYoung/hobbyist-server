export type FeedEntry = {
    hobbyId: string;
    token: string;
    title: string;
    content: string;
    type: 'text' | 'image';
    creationDate: Date;
    profile: Profile;
};

export type Profile = {
    profileSrc: string;
    username: string;
};

export type ProfileDetail = {
    bannerSrc?: string;
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

export type PaginatedResult<T> = {
    hasMoreResults: boolean;
    continuationToken: string;
    items: T;
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

export type HobbyCosmosResult = CosmosResult & {
    slug: string;
    name: string;
    description: string;
    profileSrc: string;
    bannerSrc: string;
    admins: string[];
    followers: string[];
};

export type UserProfileCosmosResult = CosmosResult & {
    userId: string;
    emailAddress: string;
    profileSrc: string;
    username: string;
    bannerSrc?: string;
    following: string[];
};

export type PostCosmosResult = CosmosResult & {
    hobbyId: string;
    userId: string;
    token: string;
    slug: string;
    title: string;
    content: string;
    type: 'text' | 'image';
    creationDate: Date;
};
