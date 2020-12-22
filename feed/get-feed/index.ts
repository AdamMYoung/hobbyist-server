import { AzureFunction, Context } from '@azure/functions';
import { FeedEntry, PaginatedResult, PostCosmosResult, UserProfileCosmosResult } from '../types';
import { cosmos } from '../utils';
import { withAuth } from '../utils/authUtils';

const httpTrigger: AzureFunction = withAuth(
    { isTokenRequired: false },
    async function (context: Context, _, token): Promise<void> {
        const continuationToken = context.req.query.continuationToken;

        const postsContainer = await cosmos.getPostsContainer();
        const userContainer = await cosmos.getUsersContainer();

        if (token) {
            const usersContainer = await cosmos.getUsersContainer();

            const { resources: users } = await usersContainer.items
                .query<Partial<UserProfileCosmosResult>>(
                    {
                        query: `SELECT TOP 1 c["following"] FROM c WHERE c["userId"] = @userId`,
                        parameters: [{ name: '@userId', value: token.sub }],
                    },
                    { partitionKey: 'userId' }
                )
                .fetchAll();

            if (!users[0]) {
                context.res = { status: 404, body: `User not found: ${token.sub}` };
                return;
            }

            const postQuery = await postsContainer.items
                .query<PostCosmosResult>(
                    {
                        query: `SELECT * FROM c WHERE ARRAY_CONTAINS(@hobbyIds, c["id"]) ORDER BY c["creationDate"] DESC`,
                        parameters: [{ name: '@hobbyIds', value: users[0].following }],
                    },
                    { maxItemCount: 20, continuationToken, partitionKey: 'id' }
                )
                .fetchNext();

            if (postQuery.resources.length === 0) {
                context.res = { status: 404, body: 'No posts found' };
                return;
            }

            const userIds = new Set<string>();
            postQuery.resources.forEach((res) => userIds.add(res.userId));

            const usersQuery = await userContainer.items
                .query<Partial<UserProfileCosmosResult>>(
                    {
                        query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(@userIds, c["userId"])',
                        parameters: [{ name: '@userIds', value: Array.from(userIds) }],
                    },
                    { partitionKey: 'userId' }
                )
                .fetchAll();

            const posts: FeedEntry[] = postQuery.resources.map<FeedEntry>((p) => {
                const profile = usersQuery.resources.filter((u) => u.userId === p.userId)[0];

                return {
                    slug: p.slug,
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
        } else {
            const postQuery = await postsContainer.items
                .query<PostCosmosResult>(
                    { query: `SELECT * FROM c ORDER BY c["creationDate"] DESC` },
                    { maxItemCount: 20, continuationToken }
                )
                .fetchNext();

            if (postQuery.resources.length === 0) {
                context.res = { status: 404, body: 'No posts found' };
                return;
            }

            const userIds = new Set<string>();
            postQuery.resources.forEach((res) => userIds.add(res.userId));

            const usersQuery = await userContainer.items
                .query<Partial<UserProfileCosmosResult>>({
                    query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(@userIds, c["userId"])',
                    parameters: [{ name: '@userIds', value: Array.from(userIds) }],
                })
                .fetchAll();

            const posts: FeedEntry[] = postQuery.resources.map<FeedEntry>((p) => {
                const profile = usersQuery.resources.filter((u) => u.userId === p.userId)[0];

                return {
                    slug: p.slug,
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
    }
);

export default httpTrigger;
