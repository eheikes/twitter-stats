# Twitter Stats

A `top`-style (CLI), real-time view of Twitter stats. Stats are collected by sampling Twitter's [public stream](https://dev.twitter.com/docs/streaming-apis/streams/public).

![ScreenShot](https://raw.github.com/eheikes/twitter-stats/screenshots/images/screenshot.png)

## Requirements

* [Node & npm](http://nodejs.org/)
* [Twitter](https://twitter.com/) account
* [Redis](http://redis.io/) server

## Installation

1. Run `npm install`.
2. Modify the `config/default.yaml` with your Redis configuration, if necessary. (You can optionally override `default.yaml` [with your own file](https://github.com/lorenwest/node-config/wiki/Configuration-Files).)
3. [Create a Twitter app](https://dev.twitter.com/docs/auth/tokens-devtwittercom) and update the `config/default.yaml` file with your app credentials.

## Usage

Run `node stats`. Press Ctrl-C to quit.

## Stats

The info that is included in the output, from top to bottom:

* time spent collecting data ("since x ago" in the header)
* number of tweets examined
* rate of tweets received from Twitter
* percentage of tweets containing a URL (_excluding_ pictures from Twitter Photo Upload)
* percentage of tweets containing a picture (Twitter Photo Upload or Instagram link)
* percentage of tweets with an associated location
* percentage of tweets that are replies
* percentage of tweets that are retweets
* most popular hashtags
* most popular domains in links
* most popular languages of the tweets
* most popular countries from the associated locations
* most popular sources of tweets (apps)
* most prolific users
* most mentioned users
* most popular links

## Testing

Run `grunt test` to run the test suite.

## Known Issues

Tested on Linux/Debian and Windows 7.

* The [curses routines](lib/formatter.js) can probably be improved, if you can figure out the [horribly-documented blessed library](https://github.com/chjj/blessed).
* There is no l10n/i18n done beyond what comes with Node and the included modules. It works pretty well, but CJK languages do cause rendering issues.
* Stats collection is not bounded, so theoretically the counters will overflow after ~1.8e308 tweets, or memory will be consumed to store all the hashtags and domains.
