function createDbUser(user, context, callback) {
    user.app_metadata = user.app_metadata || {};

    if (user.app_metadata.user_in_database === true) {
        return callback(null, user, context);
    } else {
        const axios = require('axios');

        const options = {
            method: 'POST',
            url: `https://${auth0.domain}/oauth/token`,
            headers: { 'content-type': 'application/json' },
            data: `{"client_id": "${configuration.SERVERLESS_CLIENT_ID}","client_secret":"${configuration.SERVERLESS_CLIENT_SECRET}","audience":"api.hobbyist.app","grant_type":"client_credentials"}`,
        };

        axios(options)
            .then((res) => {
                const accessToken = res.data.access_token;
                user.app_metadata.username =
                    user.username || user.email.split('@')[0] + Math.floor(Math.random() * 99999) + 1;

                axios
                    .post(
                        `${configuration.SERVERLESS_API_URL}/users/me`,
                        {
                            userId: user.user_id,
                            emailAddress: user.email,
                            profileSrc: user.picture,
                            username: user.app_metadata.username,
                        },
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    )
                    .then((res) => {
                        user.app_metadata.user_in_database = true;

                        auth0.users
                            .updateAppMetadata(user.user_id, user.app_metadata)
                            .then(() => {
                                return callback(null, user, context);
                            })
                            .catch((err) => {
                                return callback(err);
                            });
                    })
                    .catch((res) => {
                        user.app_metadata.user_in_database = false;

                        auth0.users
                            .updateAppMetadata(user.user_id, user.app_metadata)
                            .then(() => {
                                return callback(null, user, context);
                            })
                            .catch((err) => {
                                return callback(err);
                            });
                    });
            })
            .catch((err) => {
                return callback(err);
            });
    }

    return callback(null, user, context);
}
