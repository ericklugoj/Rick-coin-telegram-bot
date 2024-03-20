export function isAdmin(idOfChat, IdOfUser, ctx) {
  return new Promise((resolve, reject) => {
    //Get user information first
    ctx.telegram
      .getChatMember(idOfChat, IdOfUser)
      .then((user) => {
        //Then check if user is admin (or creator)
        resolve(user.status == 'administrator' || user.status == 'creator');
      })
      .catch((error) => {
        //Reject if it's an error
        reject(error);
      });
  });
}
