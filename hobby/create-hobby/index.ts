import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { cosmos, image } from '../utils';
import { CreateHobbyRequest, Hobby } from '../types';
import { withAuth } from '../utils/authUtils';

const httpTrigger: AzureFunction = withAuth<CreateHobbyRequest>(null, async (context: Context, body, token) => {
    const hobbyContainer = await cosmos.getHobbiesContainer();
    const hobbyExists = await hobbyContainer.items
        .query({
            query: 'SELECT count(c.id) FROM c WHERE c.name = @hobbyName',
            parameters: [{ name: '@hobbyName', value: body.name }],
        })
        .fetchAll();

    if (hobbyExists.resources.length !== 0) {
        context.res = { status: 409 };
        return;
    }

    const profileSrc = await image.uploadImage({ base64Image: body.profileImgBase64, storageLocation: 'hobby' });
    const bannerSrc = await image.uploadImage({ base64Image: body.bannerImgBase64, storageLocation: 'hobby' });

    const newHobby = { name: body.name, description: body.description, profileSrc, bannerSrc };

    await hobbyContainer.items.create<Hobby>(newHobby);

    context.res = {
        status: 201,
        body: newHobby,
    };
});

export default httpTrigger;
