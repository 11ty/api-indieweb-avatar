const fetch = require("node-fetch");
const cheerio = require("cheerio");
const EleventyImage = require("@11ty/eleventy-img");

class AvatarHtml {
  constructor(url) {
    this.url = url;

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
    let response = await fetch(this.url);
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
    let icons = this.$("link[rel='icon']");

    for(let icon of icons) {
      let sizesStr = icon.attribs.sizes;
      let typeStr = icon.attribs.type;
      let type;
      if(typeStr.startsWith("image/") || typeStr.startsWith("img/")) {
        type = typeStr.split("/")[1];
      }

      results.push({
        href: this.normalizePath(icon.attribs.href),
        size: sizesStr ? sizesStr.split("x") : [0, 0],
        type,
      });
    }

    return results.sort((a, b) => {
      return b.size[0] - a.size[0];
    });
  }

  findAppleTouchIcon() {
    let icon = this.$("link[rel='apple-touch-icon']");
    if(icon.length) {
      return this.normalizePath(icon[0].attribs.href);
    }
  }

  async getAvatar(width, fallbackImageFormat) {
    let appleTouchIconHref = this.findAppleTouchIcon();
    if(appleTouchIconHref) {
      return this.optimizeAvatar(appleTouchIconHref, width, fallbackImageFormat);
    }

    let relIcons = this.findRelIcons();
    if(relIcons.length) {
      let format = relIcons[0].type || fallbackImageFormat;
      return this.optimizeAvatar(relIcons[0].href, width, format)
    }

    throw new Error(`No icon found for ${this.url}`);
  }

  async optimizeAvatar(avatarUrl, width, imageFormat) {
    // normalize format
    if(imageFormat && imageFormat === "svg+xml") {
      imageFormat = "svg";
    }

    let stats = await EleventyImage(avatarUrl, {
      widths: [width],
      formats: [imageFormat],
      dryRun: true,
    });

    let output = stats[imageFormat][0].buffer;
    return output;
  }
}

module.exports = AvatarHtml;