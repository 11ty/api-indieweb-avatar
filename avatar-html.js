import * as cheerio from 'cheerio';
import EleventyImage from "@11ty/eleventy-img";
import EleventyFetch from "@11ty/eleventy-fetch";
import icoToPng from "ico-to-png";

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

class AvatarHtml {
  constructor(url, options = {}) {
    this.url = url;
    // aborts any in-flight requests, e.g. when a host stalls past our time budget
    this.signal = options.signal;

    if(!this.isFullUrl(url)) {
      throw new Error(`Invalid \`url\`: ${url}`);
    }
  }

  isFullUrl(url) {
    try {
      new URL(url);
      return true;
    } catch(e) {
      // invalid url OR local path
      return false;
    }
  }

  async fetch() {
    let response = await fetch(this.url, {
      headers: {
        "user-agent": USER_AGENT
      },
      signal: this.signal,
    });
    let body = await response.text();
    this.body = body;

    this.$ = cheerio.load(body);
    return body;
  }

  normalizePath(path) {
    let u = new URL(path, this.url);
    return u.href;
  }

  /* Returns largest found */
  findRelIcons() {
    let results = [];

    let icons = this.$("link[rel~='icon']");

    for(let icon of icons) {
      if(!icon.attribs.href) {
        continue;
      }

      // adobe.com uses `data:,` to opt-out of the browser’s default /favicon.ico request
      let href = this.normalizePath(icon.attribs.href);
      if(!AvatarHtml.isHttpHref(href)) {
        continue;
      }

      let sizesStr = icon.attribs.sizes;
      let typeStr = icon.attribs.type;
      let type;
      if(typeStr) {
        if(typeStr.startsWith("image/") || typeStr.startsWith("img/")) {
          type = typeStr.split("/")[1];
        }
      }

      results.push({
        href,
        size: sizesStr ? sizesStr.split("x") : [0, 0],
        type,
      });
    }

    // TODO deprioritize "image/x-icon" if the sizes are the same
    return results.sort((a, b) => {
      let ordering = b.size[0] - a.size[0];
      if(!Number.isNaN(ordering)) { return ordering; }
      else if(b.size[0].toLowerCase() === 'any') { return 1; }
      else { return -1; }
    });
  }

  findAppleTouchIcon() {
    let icon = this.$("link[rel~='apple-touch-icon']");
    if(icon.length > 0) {
      let hrefs = [];
      for(let i of icon) {
        let size = parseInt(i.attribs.sizes) || 0; // NUMxNUM parses to NUM
        hrefs.push({ href: i.attribs.href, size });
      }
      hrefs.sort((a, b) => {
        if(a.size && b.size) {
          return b.size - a.size;
        }
        if(a.size) {
          return -1;
        }
        if(b.size) {
          return 1;
        }
        return 0;
      });

      return this.normalizePath(hrefs[0].href);
    }

    let precomposedIcon = this.$("link[rel~='apple-touch-icon-precomposed']");
    if(precomposedIcon.length > 0) {
      return this.normalizePath(precomposedIcon[0].attribs.href);
    }
  }

  async convertIcoToPng(href, width) {
    let icoBuffer = await EleventyFetch(href, {
      type: "buffer",
      dryRun: true,
      fetchOptions: {
        headers: {
          "user-agent": USER_AGENT
        },
        signal: this.signal,
      }
    });
    return icoToPng(icoBuffer, width);
  }

  static isHttpHref(href) {
    try {
      let u = new URL(href);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch(e) {
      return false;
    }
  }

  static isIcoHref(ref) {
    if(!ref) {
      return false;
    }

    // properly ignores searchparams
    let u = new URL(ref, "https://example.com");
    return u.pathname.endsWith(".ico");
  }

  async getAvatar(width, fallbackImageFormat) {
    let appleTouchIconHref = this.findAppleTouchIcon();
    if(appleTouchIconHref) {
      let input = appleTouchIconHref;
      // discord.com uses an .ico file in its apple touch icon
      if(AvatarHtml.isIcoHref(appleTouchIconHref)) {
        input = await this.convertIcoToPng(appleTouchIconHref, width);
      }
      return this.optimizeAvatar(input, width, fallbackImageFormat);
    }

    let relIcons = this.findRelIcons();
    let fallbackIconHref;

    if(relIcons.length) {
      // HARDCODE WORKAROUND: reported png when it was an .ico
      if(relIcons[0].href.startsWith("https://www.orange.com") && relIcons[0].type === "png") {
        relIcons[0].forceType = "x-icon";
      }

      // https://stateofjs.com/en-us/ has a bad mime `type` for their SVG icon
      if(!relIcons[0].forceType && relIcons[0].type === "x-icon" && (!relIcons[0].href || !AvatarHtml.isIcoHref(relIcons[0].href))) {
        let format = fallbackImageFormat;
        return this.optimizeAvatar(relIcons[0].href, width, format);
      } else if((relIcons[0].forceType || relIcons[0].type) === "x-icon" || relIcons[0].href && AvatarHtml.isIcoHref(relIcons[0].href)) {
        let pngBuffer = await this.convertIcoToPng(relIcons[0].href, width);
        return this.optimizeAvatar(pngBuffer, width, "png");
      } else if(!relIcons[0].type) {
        fallbackIconHref = relIcons[0].href;
      } else {
        let format = relIcons[0].type || fallbackImageFormat;
        return this.optimizeAvatar(relIcons[0].href, width, format)
      }
    }

    // microsoft.com/apple-touch-icon.png also works, apparently
    let href = fallbackIconHref || this.normalizePath("/favicon.ico");

    try {
      let pngBuffer = await this.convertIcoToPng(href, width);
      return await this.optimizeAvatar(pngBuffer, width, fallbackImageFormat);
    } catch(e) {
      try {
        // not all favicon.ico are ico files
        return await this.optimizeAvatar(href, width, fallbackImageFormat);
      } catch(e) {
        // if favicon.ico didn’t work, use the first header image
        let headerImage = this.$("header img");
        if(headerImage.length > 0) {
          let firstHeaderImageSrc = this.normalizePath(headerImage[0].attribs.src);
          return this.optimizeAvatar(firstHeaderImageSrc, width, fallbackImageFormat);
        }

        throw e;
      }
    }
  }

  async optimizeAvatar(sharpInput, width, imageFormat) {
    // normalize format
    if(imageFormat && (imageFormat === "svg+xml" || imageFormat === "svg")) {
      imageFormat = "png";
    }
    return EleventyImage(sharpInput, {
      widths: [width],
      formats: [imageFormat],
      dryRun: true,
      failOnError: true,
    });
  }
}

export default AvatarHtml;
