<p align="center"><img src="https://www.11ty.dev/img/logo-github.svg" width="200" height="200" alt="11ty Logo"></p>

# IndieWeb Avatar API

A runtime service to extract avatar images from:

1. `<link rel="apple-touch-icon">`
1. `<link rel="apple-touch-icon-precomposed">`
1. `<link rel="icon">`
1. `favicon.ico` (added September 20, 2021)
1. TODO: Support Data URIs in attribute values. (e.g. https://joshcrain.io)
1. TODO: `<link rel="mask-icon">`
1. TODO (maybe): `<link rel="manifest">`
1. TODO (maybe): `<meta name="msapplication-config">`

All `rel` lookups match against attribute values that are space separated lists.

## Usage

URLs have the formats:

```
/:url/
```

* `url` must be URI encoded.

## Deploy your own

<a href="https://app.netlify.com/start/deploy?repository=https://github.com/11ty/api-indieweb-avatar"><img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify"></a>

<!-- 
### Advanced: Manual Cache Busting

If the screenshots aren’t updating at a high enough frequency you can pass in your own cache busting key using an underscore prefix `_` after your URL.

This can be any arbitrary string tied to your unique build, here’s an example that uses the date to at-most request a new version every day.:

```
/:url/_20210802/
``` -->
