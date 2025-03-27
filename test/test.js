import AvatarHtml from "../avatar-html.js";
// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

(async function() {
  // let url = "https://fixa11y.com/"; // svg
  // let url = "https://changelog.com/"; // favicon
  // let url = "https://www.youtube.com/watch?v=eRRkvI-w5Ik";
  // let url = "https://lynnandtonic.com";
  // let url = "https://sarah.dev/";
  // let url = "https://changelog.com/jsparty/217";
  // let url = "https://stateofjs.com/en-us/";
  // let url = "https://twitter.com/";
  // let url = "https://opencollective.com/";
  // let url = "https://www.linkedin.com";
  // let url = "https://www.zachleat.com/twitter/";
  // let url = "https://codepen.io";
  // let url = "https://discord.com/";
  // let url = "https://www.stanford.edu"; // bad cert error
  let url = "https://www.noaa.gov/"; // bad cert error
  let avatar = new AvatarHtml(url);
  let html = await avatar.fetch();

  try {
    let stats = await avatar.getAvatar(150, "png");
    console.log( stats );
  } catch(e) {
    console.log( "ERROR", e );
  }

  // console.log( stats[format][0].buffer.toString() );
})();