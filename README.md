# Twitter Stats

A `top`-style (CLI), real-time view of Twitter stats. Stats are collected by sampling Twitter's [public stream](https://dev.twitter.com/docs/streaming-apis/streams/public).

## Installation

1. Run `npm install`.
2. [Create a Twitter app](https://dev.twitter.com/docs/auth/tokens-devtwittercom) and update the `config/default.yaml` file with your app credentials. (You can optionally override `default.yaml` [with your own file](http://lorenwest.github.io/node-config/latest/index.html).)

## Usage

Run `node stats`. Press Ctrl-C to quit.

## Stats

The info that is included in the output, from top to bottom:

* time spent collecting data ("since x ago" in the header)
* number of tweets examined
* rate of tweets received from Twitter
* percentage of tweets containing a URL (_excluding_ pictures from Twitter Photo Upload)
* percentage of tweets containing a picture (Twitter Photo Upload or Instagram link)
* most popular hashtags
* most popular domains in links

## Known Issues

Tested on Linux/Debian.

* The [curses routines](lib/formatter.js) can probably be improved, if you can figure out the [horribly-documented blessed library](https://github.com/chjj/blessed).
* The [IncrementedSet](lib/incremented-set.js) is a naive implementation I wrote of a priority queue-like data structure, since I couldn't find any good library that fit what I was looking for.
* There is no l10n/i18n done beyond what comes with Node and the included modules. It works pretty well, but does cause rendering issues occasionally.
* Stats collection is not bounded, so theoretically the counters will overflow after ~1.8e308 tweets, or memory will be consumed to store all the hashtags and domains.
