function getIp(user, context, callback) {
    user.user_metadata = user.user_metadata || {};

    user.user_metadata.geoip = context.request.geoip;

    auth0.users
        .updateUserMetadata(user.user_id, user.user_metadata)
        .then(() => {
            context.idToken['https://hobbyist.app/geoip'] = context.request.geoip;
            callback(null, user, context);
        })
        .catch((err) => {
            callback(err);
        });
}
