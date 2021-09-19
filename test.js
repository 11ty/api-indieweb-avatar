const AvatarHtml = require("./functions/avatar/avatarHtml");

(async function() {
  let avatar = new AvatarHtml("https://www.netlify.com/");
  let html = await avatar.fetch();
  let avatarUrl = avatar.findAvatarUrl();
  console.log( avatarUrl );

  let buffer = await avatar.optimizeAvatar(avatarUrl, 150, "jpeg");
  console.log( buffer.toString() );
})();