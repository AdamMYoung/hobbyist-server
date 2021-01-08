import { AzureFunction, Context } from '@azure/functions';
import { FeedEntry, HobbyCosmosResult, PaginatedResult, PostCosmosResult, UserProfileCosmosResult } from '../types';
import { cosmos } from '../utils';
import { withAuth } from '../utils/authUtils';

const httpTrigger: AzureFunction = withAuth(
    { isTokenRequired: false },
    async function (context: Context): Promise<void> {
        const username = context.req.query.username;
        const continuationToken = context.req.query.continuationToken;

        const postsContainer = await cosmos.getPostsContainer();
        const hobbyContainer = await cosmos.getHobbiesContainer();
        const userContainer = await cosmos.getUsersContainer();

        const usersQuery = await userContainer.items
            .query<Partial<UserProfileCosmosResult>>({
                query:
                    'SELECT TOP 1 c["userId"], c["username"], c["profileSrc"] FROM c WHERE c["username"] = @username',
                parameters: [{ name: '@username', value: username }],
            })
            .fetchAll();

        if (usersQuery.resources?.length === 0) {
            context.res = { status: 404, body: `User not found for username: ${username}` };
            return;
        }
        const postQuery = await postsContainer.items
            .query<PostCosmosResult>(
                {
                    query: `SELECT * FROM c WHERE c["userId"] = @userId ORDER BY c["_ts"] DESC`,
                    parameters: [{ name: '@userId', value: usersQuery.resources[0].userId }],
                },
                { maxItemCount: 20, continuationToken }
            )
            .fetchNext();

        if (postQuery.resources.length === 0) {
            context.res = { status: 404, body: 'No posts found' };
            return;
        }

        const postHobbyIds = new Set<string>();

        postQuery.resources.forEach((post) => postHobbyIds.add(post.hobbyId));

        const hobbyQuery = await hobbyContainer.items
            .query<Partial<HobbyCosmosResult>>({
                query:
                    'SELECT c["id"], c["slug"], c["name"], c["profileSrc"] FROM c WHERE ARRAY_CONTAINS(@hobbyIds, c["id"])',
                parameters: [{ name: '@hobbyIds', value: Array.from(postHobbyIds) }],
            })
            .fetchAll();

        const posts: FeedEntry[] = postQuery.resources.map<FeedEntry>((p) => {
            const profile = usersQuery.resources[0];
            const hobby = hobbyQuery.resources.filter((h) => h.id === p.hobbyId)[0];

            return {
                hobbyProfileSrc: hobby?.profileSrc ?? '',
                hobbySlug: hobby?.slug ?? '',
                hobbyName: hobby?.name ?? '',
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
