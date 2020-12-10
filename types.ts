export type Meetup = {
    id: string;
    name: string;
    date: Date;
    description: string;
    address?: string;
    hobbyId: string;
    lat: number;
    lng: number;
};

export type HobbyCategory = {
    id: string;
    name: string;
    hobbies: Hobby[];
};

export type Hobby = {
    id: string;
    src: string;
    title: string;
    description: string;
    memberCount: number;
};

export type Profile = {
    name: string;
    src: string;
    id: string;
};

type Post = {
    id: string;
    hobbyId: string;
    profile: Profile;
    created: Date;
    title: string;
    commentCount: number;
    likes: number;
    liked?: boolean;
};

export type TextPost = Post & {
    type: 'text';
    content: string;
};

export type ImagePost = Post & {
    type: 'image';
    images: string[];
};

export type PostTypes = TextPost | ImagePost;

export enum FeedSortType {
    Feed = 'Feed',
    New = 'New',
    Week = 'Week',
    Month = 'Month',
    Year = 'Year',
}

export type Auth0UserProfile = {
    userId: string;
    emailAddress: string;
    username: string;
    profileSrc: string;
};
