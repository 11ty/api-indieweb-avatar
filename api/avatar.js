import AvatarHtml from "../avatar-html.js";

const ONE_HOUR = 60*60;
const ONE_DAY = ONE_HOUR*24;
const ONE_WEEK = ONE_DAY*7;

const IMAGE_WIDTH = 60;
const IMAGE_HEIGHT = 60;
const FALLBACK_IMAGE_FORMAT = "png";

function isFullUrl(url) {
  try {
    new URL(url);
    return true;
  } catch(e) {
    // invalid url OR local path
    return false;
  }
}

function getEmptyImageResponse(errorMessage) {
  // We need to return 200 here or Firefox won’t display the image
  // empty svg
  return new Response(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" aria-hidden="true" focusable="false"></svg>`, {
    status: 200,
    headers: {
      "content-type": "image/svg+xml",
      "x-11ty-error-message": errorMessage,
      "cache-control": `public, s-maxage=${ONE_WEEK}, stale-while-revalidate=${ONE_DAY}`,
    }
  })
}

export async function GET(request, context) {
  // e.g. /https%3A%2F%2Fwww.11ty.dev%2F/
  let requestUrl = new URL(request.url);
  let [url] = requestUrl.pathname.split("/").filter(entry => !!entry);

  if(url?.endsWith("favicon.ico")) {
    return getEmptyImageResponse("");
  }

  url = decodeURIComponent(url);

  try {
    // output to Function logs
    console.log("Fetching", url);

    // short circuit circular requests
    if(isFullUrl(url) && (new URL(url)).hostname.endsWith(".indieweb-avatar.11ty.dev")) {
      return getEmptyImageResponse("Circular request");
    }

    let avatar = new AvatarHtml(url);
    await avatar.fetch();

    let stats = await avatar.getAvatar(IMAGE_WIDTH, FALLBACK_IMAGE_FORMAT);
    let format = Object.keys(stats).pop();
    let stat = stats[format][0];

    return new Response(stat.buffer, {
      status: 200,
      headers: {
        "content-type": stat.sourceType,
        "cache-control": `public, max-age=${ONE_HOUR}, s-maxage=${ONE_WEEK}, stale-while-revalidate=${ONE_DAY}`
      }
    });
  } catch (error) {
    console.log("Error", error);
    return getEmptyImageResponse(error.message);
  }
}

