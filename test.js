const AvatarHtml = require("./functions/avatar/avatarHtml");

(async function() {
  let avatar = new AvatarHtml("https://www.zachleat.com/");
  let html = await avatar.fetch();
  console.log( avatar.findAvatar() );
})();