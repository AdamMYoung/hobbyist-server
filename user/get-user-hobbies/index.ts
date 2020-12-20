import { AzureFunction, Context } from '@azure/functions';
import { Hobby, HobbyCosmosResult } from '../types';
import { cosmos } from '../utils';
import { withAuth } from '../utils/authUtils';

const getUserHobbies: AzureFunction = withAuth(null, async (context: Context, _, token) => {
    const username = context.req.query.username;

    const userContainer = await cosmos.getUsersContainer();
    const hobbyContainer = await cosmos.getHobbiesContainer();

    const { resources: users } = await userContainer.items
        .query<{ following: string[] }>({
            query: `SELECT TOP 1 c["following"] FROM c WHERE c["username"] = @username`,
            parameters: [{ name: '@username', value: username }],
        })
        .fetchAll();

    const followingHobbyIds = users[0]?.following;

    if (!followingHobbyIds) {
        context.res = { status: 404 };
        return;
    }

    context.log('HobbyIDs', followingHobbyIds);

    const { resources: hobbies } = await hobbyContainer.items
        .query<Partial<HobbyCosmosResult> & { isFollowing: boolean }>({
            query:
                'SELECT c["slug"], c["name"], c["description"], c["profileSrc"], c["bannerSrc"], ARRAY_CONTAINS(c["followers"], @userId) AS isFollowing FROM c WHERE ARRAY_CONTAINS(@hobbyIds, c.id) <> true',
            parameters: [{ name: '@hobbyIds', value: followingHobbyIds }],
        })
        .fetchAll();

    context.log('Hobbies', hobbies);

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

export default getUserHobbies;
