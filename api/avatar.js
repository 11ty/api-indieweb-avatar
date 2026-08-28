import AvatarHtml from "../avatar-html.js";

const ONE_HOUR = 60*60;
const ONE_DAY = ONE_HOUR*24;
const ONE_WEEK = ONE_DAY*7;

// Vercel functions abort at 10s, leave room to return a transparent image instead
const TIMEOUT = 8*1000;

const IMAGE_WIDTH = 60;
const IMAGE_HEIGHT = 60;
const FALLBACK_IMAGE_FORMAT = "png";

class TimeoutError extends Error {}

function isFullUrl(url) {
  try {
    new URL(url);
    return true;
  } catch(e) {
    // invalid url OR local path
    return false;
  }
}

// rejects when the deadline hits, so a stalled host can’t run out the function limit
function rejectOnTimeout(signal) {
  return new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => {
      reject(new TimeoutError(`Timed out after ${TIMEOUT}ms`));
    }, { once: true });
  });
}

function getEmptyImageResponse(errorMessage, maxAge = ONE_WEEK) {
  // We need to return 200 here or Firefox won’t display the image
  // empty svg
  return new Response(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" aria-hidden="true" focusable="false"></svg>`, {
    status: 200,
    headers: {
      "content-type": "image/svg+xml",
      "x-11ty-error-message": errorMessage,
      "cache-control": `public, s-maxage=${maxAge}, stale-while-revalidate=${ONE_DAY}`,
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

    // aborts the in-flight fetches *and* rejects, so we always beat the function limit
    let signal = AbortSignal.timeout(TIMEOUT);
    let avatar = new AvatarHtml(url, { signal });

    let stats = await Promise.race([
      (async () => {
        await avatar.fetch();
        return avatar.getAvatar(IMAGE_WIDTH, FALLBACK_IMAGE_FORMAT);
      })(),
      rejectOnTimeout(signal),
    ]);

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

    // don’t cache a slow host for a full week, it may just be having a bad day
    if(error instanceof TimeoutError || error.name === "TimeoutError" || error.name === "AbortError") {
      return getEmptyImageResponse(error.message, ONE_DAY);
    }

    return getEmptyImageResponse(error.message);
  }
}

