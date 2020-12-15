function setUserParams(user, context, callback) {
    user.app_metadata = user.app_metadata || {};
    user.app_metadata.username = user.app_metadata.username || '';

    context.idToken['https://hobbyist.app/metadata'] = {
        username: user.app_metadata.username,
    };

    return callback(null, user, context);
}
