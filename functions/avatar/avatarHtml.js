const fetch = require("node-fetch");
const cheerio = require("cheerio");

class AvatarHtml {
  constructor(url) {
    this.url = url;
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

  findAvatar() {
    let relIcon = this.findRelIcon();
    return relIcon;
  }
}

module.exports = AvatarHtml;