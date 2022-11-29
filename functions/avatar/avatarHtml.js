const fetch = require("node-fetch");
const cheerio = require("cheerio");
const EleventyImage = require("@11ty/eleventy-img");
const EleventyFetch = require("@11ty/eleventy-fetch");
const icoToPng = require('ico-to-png')

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
    let icons = this.$("link[rel~='icon']");

    for(let icon of icons) {
      let sizesStr = icon.attribs.sizes;
      let typeStr = icon.attribs.type;
      let type;
      if(typeStr) {
        if(typeStr.startsWith("image/") || typeStr.startsWith("img/")) {
          type = typeStr.split("/")[1];
        }
      }

      results.push({
        href: this.normalizePath(icon.attribs.href),
        size: sizesStr ? sizesStr.split("x") : [0, 0],
        type: type || "auto",
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
    if(icon.length) {
      return this.normalizePath(icon[0].attribs.href);
    }

    let precomposedIcon = this.$("link[rel~='apple-touch-icon-precomposed']");
    if(precomposedIcon.length) {
      return this.normalizePath(precomposedIcon[0].attribs.href);
    }
  }

  async convertIcoToPng(href, width) {
    let icoBuffer = await EleventyFetch(href, {
      type: "buffer",
      dryRun: true,
    });
    return icoToPng(icoBuffer, width);
  }

  async getAvatar(width, fallbackImageFormat) {
    let appleTouchIconHref = this.findAppleTouchIcon();
    if(appleTouchIconHref) {
      return this.optimizeAvatar(appleTouchIconHref, width, fallbackImageFormat);
    }

    let relIcons = this.findRelIcons();
    if(relIcons.length) {
      // https://stateofjs.com/en-us/ has a bad mime `type` for their SVG icon
      if(relIcons[0].type === "x-icon" && !(relIcons[0].href && relIcons[0].href.endsWith(".ico"))) {
        let format = fallbackImageFormat;
        return this.optimizeAvatar(relIcons[0].href, width, format);
      } else if(relIcons[0].type === "x-icon" || relIcons[0].href && relIcons[0].href.endsWith(".ico")) {
        let pngBuffer = await this.convertIcoToPng(relIcons[0].href, width);
        return this.optimizeAvatar(pngBuffer, width, "png");
      } else {
        let format = relIcons[0].type || fallbackImageFormat;
        return this.optimizeAvatar(relIcons[0].href, width, format)
      }
    }

    let href = this.normalizePath("/favicon.ico");
    let pngBuffer = await this.convertIcoToPng(href, width);
    return this.optimizeAvatar(pngBuffer, width, "png");
  }

  async optimizeAvatar(sharpInput, width, imageFormat) {
    // normalize format
    if(imageFormat && imageFormat === "svg+xml") {
      imageFormat = "svg";
    }

    let stats = await EleventyImage(sharpInput, {
      widths: [width],
      formats: [imageFormat],
      dryRun: true,
    });

    return stats;
  }
}

module.exports = AvatarHtml;
