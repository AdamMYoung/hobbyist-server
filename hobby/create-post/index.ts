import { AzureFunction, Context } from '@azure/functions';
import { cosmos } from '../utils';
import { CreatePostRequest, HobbyCosmosResult, PostCosmosResult } from '../types';
import { withAuth } from '../utils/authUtils';
import { paramCase } from 'param-case';
import { getId } from '../utils/stringUtils';

const httpTrigger: AzureFunction = withAuth<CreatePostRequest>(null, async (context: Context, body, token) => {
    const slug = context.req.query.slug;

    const hobbyContainer = await cosmos.getHobbiesContainer();
    const postsContainer = await cosmos.getPostsContainer();

    const hobbyQuery = await hobbyContainer.items
        .query<Partial<HobbyCosmosResult>>({
            query:
                'SELECT TOP 1 c["slug"], c["name"], c["description"], c["profileSrc"], c["bannerSrc"] FROM c WHERE c["slug"] = @hobbySlug',
            parameters: [{ name: '@hobbySlug', value: slug }],
        })
        .fetchAll();

    const fetchedHobby = hobbyQuery.resources[0];

    if (!fetchedHobby) {
        context.res = { status: 404 };
        return;
    }

    const newPost: Partial<PostCosmosResult> = {
        hobbyId: fetchedHobby?.id,
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
        body: newPost,
    };
});

export default httpTrigger;
