const AvatarHtml = require("./functions/avatar/avatarHtml");

(async function() {
  let url = "https://danabyerly.com/";
  console.log( url );
  let avatar = new AvatarHtml(url);
  let html = await avatar.fetch();

  let buffer = await avatar.getAvatar(150, "jpeg");
  console.log( buffer.toString() );
})();