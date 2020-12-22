import { AzureFunction, Context } from '@azure/functions';
import { FeedEntry, HobbyCosmosResult, PaginatedResult, PostCosmosResult, UserProfileCosmosResult } from '../types';
import { cosmos } from '../utils';
import { withAuth } from '../utils/authUtils';

const httpTrigger: AzureFunction = withAuth(
    { isTokenRequired: false },
    async function (context: Context): Promise<void> {
        const hobbySlug = context.req.query.slug;
        const continuationToken = context.req.query.continuationToken;

        const postsContainer = await cosmos.getPostsContainer();
        const hobbyContainer = await cosmos.getHobbiesContainer();
        const userContainer = await cosmos.getUsersContainer();

        const { resources: hobbies } = await hobbyContainer.items
            .query<HobbyCosmosResult>({
                query: 'SELECT TOP 1 * FROM c WHERE c["slug"] = @hobbySlug',
                parameters: [{ name: '@hobbySlug', value: hobbySlug }],
            })
            .fetchAll();

        if (!hobbies[0]) {
            context.res = { status: 404, body: `No hobby found for slug: ${hobbySlug}` };
            return;
        }

        const postQuery = await postsContainer.items
            .query<PostCosmosResult>(
                {
                    query: `SELECT * FROM c WHERE c["id] = @hobbyId ORDER BY c["_ts"] DESC`,
                    parameters: [{ name: '@hobbyId', value: hobbies[0].id }],
                },
                { maxItemCount: 20, continuationToken }
            )
            .fetchNext();

        if (postQuery.resources.length === 0) {
            context.res = { status: 404, body: 'No posts found' };
            return;
        }

        const userIds = new Set<string>();
        const hobbyIds = new Set<string>();

        postQuery.resources.forEach((res) => {
            userIds.add(res.userId);
            hobbyIds.add(res.hobbyId);
        });

        const usersQuery = await userContainer.items
            .query<Partial<UserProfileCosmosResult>>({
                query:
                    'SELECT c["userId"], c["username"], c["profileSrc"] FROM c WHERE ARRAY_CONTAINS(@userIds, c["userId"])',
                parameters: [{ name: '@userIds', value: Array.from(userIds) }],
            })
            .fetchAll();

        const posts: FeedEntry[] = postQuery.resources.map<FeedEntry>((p) => {
            const profile = usersQuery.resources.filter((u) => u.userId === p.userId)[0];

            return {
                hobbySlug: hobbies[0]?.slug,
                hobbyName: hobbies[0]?.name,
                token: p.token,
                title: p.title,
                type: p.type,
                creationDate: p.creationDate,
                content: p.content,
                profile: {
                    username: profile.username,
                    profileSrc: profile.profileSrc,
                },
            };
        });

        context.res = {
            body: {
                continuationToken: postQuery.continuationToken,
                hasMoreResults: postQuery.hasMoreResults,
                items: posts,
            } as PaginatedResult<FeedEntry[]>,
        };
    }
);

export default httpTrigger;
