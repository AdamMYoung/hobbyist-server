import { AzureFunction, Context } from '@azure/functions';
import { cosmos } from '../utils';
import { HobbyCosmosResult, PostCosmosResult } from '../types';
import { withAuth } from '../utils/authUtils';

const httpTrigger: AzureFunction = withAuth(null, async (context: Context, _, token) => {
    const postToken = context.req.query.postToken;
    const slug = context.req.query.slug;

    const hobbyContainer = await cosmos.getHobbiesContainer();
    const postsContainer = await cosmos.getPostsContainer();

    const { resources: hobbies } = await hobbyContainer.items
        .query<Partial<HobbyCosmosResult>>({
            query: 'SELECT TOP 1 c["id"] FROM c WHERE c["slug"] = @hobbySlug',
            parameters: [{ name: '@hobbySlug', value: slug }],
        })
        .fetchAll();

    if (!hobbies[0]) {
        context.res = { status: 404, body: `Hobby not found. Post slug: ${slug}` };
        return;
    }

    const { resources: posts } = await postsContainer.items
        .query<Partial<PostCosmosResult>>({
            query: 'SELECT TOP 1 * FROM c WHERE c["token"] = @token AND c["hobbyId"] = @hobbyId',
            parameters: [
                { name: '@token', value: postToken },
                { name: '@hobbyId', value: hobbies[0].id },
            ],
        })
        .fetchAll();

    if (!posts[0]) {
        context.res = { status: 404, body: `Post not found. Post token: ${postToken}` };
        return;
    }

    if (posts[0].userId !== token.sub) {
        context.res = { status: 403, body: 'Cannot edit a post that belongs to a different user.' };
        return;
    }

    await postsContainer.item(posts[0].id, posts[0].id).delete();

    context.res = { status: 200 };
});

export default httpTrigger;
