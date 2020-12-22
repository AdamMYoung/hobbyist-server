import { AzureFunction, Context } from '@azure/functions';
import { cosmos } from '../utils';
import { CreatePostRequest, HobbyCosmosResult, Post, PostCosmosResult, UserProfileCosmosResult } from '../types';
import { withAuth } from '../utils/authUtils';
import { paramCase } from 'param-case';
import { getId } from '../utils/stringUtils';

const httpTrigger: AzureFunction = withAuth<CreatePostRequest>(null, async (context: Context, body, token) => {
    const slug = context.req.query.slug;

    const hobbyContainer = await cosmos.getHobbiesContainer();
    const postsContainer = await cosmos.getPostsContainer();
    const usersContainer = await cosmos.getUsersContainer();

    const { resources: hobbies } = await hobbyContainer.items
        .query<Partial<HobbyCosmosResult>>({
            query: 'SELECT TOP 1 c["id"], c["name"] FROM c WHERE c["slug"] = @hobbySlug',
            parameters: [{ name: '@hobbySlug', value: slug }],
        })
        .fetchAll();

    if (!hobbies[0]) {
        context.res = { status: 404 };
        return;
    }

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

    const newPost: Partial<PostCosmosResult> = {
        hobbyId: hobbies[0]?.id,
        userId: token.sub,
        token: getId(6),
        slug: paramCase(body.title),
        title: body.title,
        content: body.content,
        type: body.type,
        creationDate: new Date(),
    };

    await postsContainer.items.create<Partial<HobbyCosmosResult>>(newPost);

    context.res = {
        status: 201,
        body: {
            profile: {
                username: users[0].username,
                profileSrc: users[0].profileSrc,
            },
            token: newPost.token,
            slug: newPost.slug,
            title: newPost.title,
            content: newPost.content,
            type: newPost.type,
            creationDate: newPost.creationDate,
        } as Post,
    };
});

export default httpTrigger;
