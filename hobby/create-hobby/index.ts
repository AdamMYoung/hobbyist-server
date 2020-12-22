import { AzureFunction, Context } from '@azure/functions';
import { cosmos, image } from '../utils';
import { CreateHobbyRequest, HobbyCosmosResult, UserProfileCosmosResult } from '../types';
import { withAuth } from '../utils/authUtils';

const httpTrigger: AzureFunction = withAuth<CreateHobbyRequest>(null, async (context: Context, body, token) => {
    const hobbySlug = body.slug;

    const hobbyContainer = await cosmos.getHobbiesContainer();
    const usersContainer = await cosmos.getUsersContainer();

    const { resources: hobbies } = await hobbyContainer.items
        .query({
            query: 'SELECT TOP 1 c["id"] FROM c WHERE c["slug"] = @hobbySlug',
            parameters: [{ name: '@hobbySlug', value: body.slug }],
        })
        .fetchAll();

    if (hobbies.length > 0) {
        context.res = { status: 409 };
        return;
    }

    const { resources: users } = await usersContainer.items
        .query<Partial<UserProfileCosmosResult>>({
            query: 'SELECT TOP 1 * FROM c WHERE c["userId"] = @userId',
            parameters: [{ name: '@userId', value: token.sub }],
        })
        .fetchAll();

    if (!users[0]) {
        context.res = { status: 404, body: `User not found. User UID: ${token.sub}` };
        return;
    }

    const profileSrc = await image.uploadImage({ base64Image: body.profileImgBase64, storageLocation: 'hobby' });
    const bannerSrc = await image.uploadImage({ base64Image: body.bannerImgBase64, storageLocation: 'hobby' });

    const newHobby: Partial<HobbyCosmosResult> = {
        slug: hobbySlug,
        name: body.name,
        description: body.description,
        profileSrc,
        bannerSrc,
        admins: [token.sub],
        followers: [token.sub],
    };

    const { resource } = await hobbyContainer.items.create<Partial<HobbyCosmosResult>>(newHobby);

    users[0].following.push(resource.id);
    usersContainer.item(users[0].id).replace(users[0]);

    context.res = {
        status: 201,
        body: newHobby,
    };
});

export default httpTrigger;
