const AvatarHtml = require("../functions/avatar/avatarHtml");

(async function() {
  // let url = "https://fixa11y.com/"; // svg
  // let url = "https://changelog.com/"; // favicon
  // let url = "https://www.youtube.com/watch?v=eRRkvI-w5Ik";
  // let url = "https://lynnandtonic.com";
  // let url = "https://sarah.dev/";
  // let url = "https://changelog.com/jsparty/217";
  let url = "https://stateofjs.com/en-us/";
  console.log( url );
  let avatar = new AvatarHtml(url);
  let html = await avatar.fetch();

  let stats = await avatar.getAvatar(150, "png");
  let format = Object.keys(stats).pop();
  console.log( format, stats );

  // console.log( stats[format][0].buffer.toString() );
})();