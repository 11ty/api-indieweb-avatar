const AvatarHtml = require("./functions/avatar/avatarHtml");

(async function() {
  // let url = "https://fixa11y.com/";
  let url = "https://changelog.com/";
  console.log( url );
  let avatar = new AvatarHtml(url);
  let html = await avatar.fetch();

  let stats = await avatar.getAvatar(150, "png");
  let format = Object.keys(stats).pop();
  console.log( format, stats );

  // console.log( stats[format][0].buffer.toString() );
})();