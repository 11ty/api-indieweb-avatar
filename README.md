# IndieWeb Avatar API

A runtime service to extract avatar images from:

1. `<link rel="apple-touch-icon">`
1. `<link rel="icon">`
1. TODO: `favicon.ico`
1. TODO: `<link rel="mask-icon">`
1. TODO (maybe): `<link rel="manifest">`
1. TODO (maybe): `<meta name="msapplication-config">`


## Usage

URLs have the formats:

```
/:url/
```

<!-- * `url` must be URI encoded.

### Advanced: Manual Cache Busting

If the screenshots aren’t updating at a high enough frequency you can pass in your own cache busting key using an underscore prefix `_` after your URL.

This can be any arbitrary string tied to your unique build, here’s an example that uses the date to at-most request a new version every day.:

```
/:url/_20210802/
``` -->
