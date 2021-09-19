const fetch = require("node-fetch");
const cheerio = require("cheerio");
const EleventyImage = require("@11ty/eleventy-img");

const WIDTH = 150;
const HEIGHT = 150;
const IMAGE_FORMAT = "jpeg";

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
  findRelIcon() {
    let results = [];
    let icons = this.$("link[rel='icon']");

    for(let icon of icons) {
      let sizesStr = icon.attribs.sizes;
      results.push({
        href: this.normalizePath(icon.attribs.href),
        size: sizesStr ? sizesStr.split("x") : [0, 0]
      })
    }

    results.sort((a, b) => {
      return b.size[0] - a.size[0];
    });

    if(results.length) {
      return results[0].href;
    }
  }

  findAvatarUrl() {
    let relIcon = this.findRelIcon();
    return relIcon;
  }

  async optimizeAvatar(avatarUrl) {
    let stats = await EleventyImage(avatarUrl, {
      widths: [WIDTH],
      format: [IMAGE_FORMAT],
      dryRun: true,
    });

    let output = stats[IMAGE_FORMAT][0].buffer;
    return output;
  }
}

module.exports = AvatarHtml;