function setRolesToUser(user, context, callback) {
  user.app_metadata = user.app_metadata || {};
  user.app_metadata.roles = user.app_metadata.roles || [];
  
  if(!user.app_metadata.roles.includes("User")) {
  	user.app_metadata.roles.push("User");   	
  } 
  
  auth0.users
    .updateAppMetadata(user.user_id, user.app_metadata)
    .then(() => {
      context.idToken['https://hobbyist.app/roles'] = user.app_metadata.roles;
      callback(null, user, context);
    })
    .catch((err) => {
      callback(err);
    });
}