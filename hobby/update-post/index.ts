import { AzureFunction, Context } from '@azure/functions';
import { cosmos } from '../utils';
import { HobbyCosmosResult, Post, PostCosmosResult, UpdatePostRequest, UserProfileCosmosResult } from '../types';
import { withAuth } from '../utils/authUtils';

const httpTrigger: AzureFunction = withAuth<UpdatePostRequest>(null, async (context: Context, body, token) => {
    const postToken = context.req.query.postToken;
    const slug = context.req.query.slug;

    const hobbyContainer = await cosmos.getHobbiesContainer();
    const postsContainer = await cosmos.getPostsContainer();
    const usersContainer = await cosmos.getUsersContainer();

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

    const existingPost = await postsContainer.items.upsert<Partial<PostCosmosResult>>({
        ...posts[0],
        content: body.content,
    });

    const { resources: users } = await usersContainer.items
        .query<Partial<UserProfileCosmosResult>>({
            query: 'SELECT TOP 1 c["userId"], c["username"], c["profileSrc"] FROM c WHERE c["userId"] = @userId',
            parameters: [{ name: '@userId', value: token.sub }],
        })
        .fetchAll();

    if (!users[0]) {
        context.res = { status: 404, body: `User not found. User UID: ${token.sub}` };
        return;
    }

    const post = existingPost.resource[0];

    context.res = {
        status: 200,
        body: {
            profile: {
                username: users[0].username,
                profileSrc: users[0].profileSrc,
            },
            token: post.token,
            slug: post.slug,
            title: post.title,
            content: post.content,
            type: post.type,
            creationDate: post.creationDate,
        } as Post,
    };
});

export default httpTrigger;
