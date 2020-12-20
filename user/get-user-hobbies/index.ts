import { AzureFunction, Context } from '@azure/functions';
import { Hobby, HobbyCosmosResult } from '../types';
import { cosmos } from '../utils';
import { withAuth } from '../utils/authUtils';

const createProfile: AzureFunction = withAuth(null, async (context: Context, _, token) => {
    const userContainer = await cosmos.getUsersContainer();
    const hobbyContainer = await cosmos.getHobbiesContainer();

    const { resources: users } = await userContainer.items
        .query<{ following: string[] }>({
            query: `SELECT TOP 1 c.following FROM c WHERE c["userId"] = @userId`,
            parameters: [{ name: '@userId', value: token.sub }],
        })
        .fetchAll();

    const followingHobbyIds = users[0].following;

    const { resources: hobbies } = await hobbyContainer.items
        .query<Partial<HobbyCosmosResult> & { isFollowing: boolean }>({
            query:
                'c["slug"], c["name"], c["description"], c["profileSrc"], c["bannerSrc"], ARRAY_CONTAINS(c["followers"], @userId) AS isFollowing FROM c WHERE c.id IN @hobbyIds',
            parameters: [{ name: '@hobbyIds', value: followingHobbyIds }],
        })
        .fetchAll();

    const parsedHobbies = hobbies.map(
        (hobby) =>
            ({
                slug: hobby.slug,
                name: hobby.name,
                description: hobby.description,
                profileSrc: hobby.profileSrc,
                bannerSrc: hobby.bannerSrc,
                following: hobby.isFollowing,
            } as Hobby)
    );

    context.res = {
        status: 200,
        body: parsedHobbies,
    };
});

export default createProfile;
