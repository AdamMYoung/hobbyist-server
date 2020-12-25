export type CreateCommentRequest = {
    content: Node[];
    parentUid?: string;
    rootUid?: string;
};

export type Profile = {
    profileSrc: string;
    username: string;
};

export type Comment = {
    uid: string;
    rootUid: string;
    profile: Profile;
    content: any;
    creationDate: Date;
    replies: Comment[];
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
    content: any;
    type: 'text' | 'image';
    creationDate: Date;
};

export type CommentEntry = {
    uid: string; // Unique ID of the reply.
    rootUid: string; //Root element of the reply chain, to reduce search space.
    userUid: string;
    content: any;
    creationDate: Date;
    replies?: CommentEntry[];
};

export type CommentCosmosResult = CosmosResult &
    CommentEntry & {
        hobbySlug: string;
        postToken: string;
    };
