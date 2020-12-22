import { AzureFunction, Context } from '@azure/functions';
import { Hobby, HobbyCosmosResult, Post, PostCosmosResult } from '../types';
import { cosmos } from '../utils';
import { withAuth } from '../utils/authUtils';

const httpTrigger: AzureFunction = withAuth(
    { isTokenRequired: false },
    async (context: Context, _, token): Promise<void> => {
        const hobbySlug = context.req.query.slug;
        const postToken = context.req.query.token;

        const postContainer = await cosmos.getPostsContainer();
        const hobbyContainer = await cosmos.getHobbiesContainer();

        const { resources: hobbies } = await hobbyContainer.items
            .query<Partial<HobbyCosmosResult>>({
                query: 'SELECT TOP 1 c["id"] FROM c WHERE c["slug"] = @hobbySlug',
                parameters: [{ name: '@hobbySlug', value: hobbySlug }],
            })
            .fetchAll();

        if (!hobbies[0]) {
            context.res = { status: 404, body: `Hobby not found. hobbySlug: ${hobbySlug}` };
            return;
        }

        const { resources: posts } = await postContainer.items
            .query<Partial<PostCosmosResult>>({
                query: 'SELECT TOP 1 * FROM c WHERE c["hobbyId"] = @hobbyId AND c["token"] = @postToken',
                parameters: [
                    { name: '@hobbyId', value: hobbies[0].id },
                    { name: '@postToken', value: postToken },
                ],
            })
            .fetchAll();

        if (!posts[0]) {
            context.res = { status: 404, body: `Post not found. PostToken: ${postToken}` };
            return;
        }

        const post: Post = {
            hobbyId: posts[0].hobbyId,
            token: posts[0].token,
            slug: posts[0].slug,
            title: posts[0].title,
            content: posts[0].content,
            type: posts[0].type,
            creationDate: posts[0].creationDate,
        };

        context.res = { body: post };
    }
);

export default httpTrigger;
