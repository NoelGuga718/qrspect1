export const SAFELIST_DOMAINS = new Set([
  'google.com',
  'www.google.com',
  'youtube.com',
  'www.youtube.com',
  'apple.com',
  'www.apple.com',
  'microsoft.com',
  'www.microsoft.com',
  'github.com',
  'www.github.com',
  'stackoverflow.com',
  'www.stackoverflow.com',
  'wikipedia.org',
  'www.wikipedia.org',
  'amazon.com',
  'www.amazon.com',
  'netflix.com',
  'www.netflix.com',
  'facebook.com',
  'www.facebook.com',
  'instagram.com',
  'www.instagram.com',
  'twitter.com',
  'www.twitter.com',
  'x.com',
  'www.x.com',
  'linkedin.com',
  'www.linkedin.com',
  'openai.com',
  'www.openai.com',
  'chat.openai.com',
  'cloudflare.com',
  'www.cloudflare.com',
  'vercel.com',
  'www.vercel.com',
  'netlify.com',
  'www.netlify.com',
  'npmjs.com',
  'www.npmjs.com',
  'pypi.org',
  'www.pypi.org',
  'reddit.com',
  'www.reddit.com',
  'bing.com',
  'www.bing.com',
  'yahoo.com',
  'www.yahoo.com',
  'whatsapp.com',
  'www.whatsapp.com',
  'web.whatsapp.com',
  'telegram.org',
  'www.telegram.org',
  't.me',
  'paypal.com',
  'www.paypal.com',
  'dropbox.com',
  'www.dropbox.com',
  'drive.google.com',
  'docs.google.com',
  'zoom.us',
  'www.zoom.us',
  'discord.com',
  'www.discord.com',
  'discord.gg',
]);

export const SUSPICIOUS_TLDS = new Set([
  'tk', 'ml', 'ga', 'cf', 'gq',
  'xyz', 'top', 'click', 'download',
  'work', 'date', 'racing', 'win',
  'country', 'stream', 'gdn', 'men',
]);

export const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl',
  'ow.ly', 'short.link', 'is.gd', 'buff.ly',
  'adf.ly', 'bitly.com', 'shorturl.at', 'rebrand.ly',
  'cutt.ly', 'short.io', 'bl.ink', 't.ly',
]);

// Known IP logger and tracking link services
export const IP_LOGGER_DOMAINS = new Set([
  // Grabify and its alternate domains
  'grabify.link',
  'grabify.org',
  'grabify.icu',
  'grabify.world',
  'screenshare.pics',
  'screenshare.host',
  'screenshot.best',
  'catsnthing.com',
  'catsnthings.fun',
  'crabrave.pw',
  'curiouscat.club',
  'datasig.io',
  'datauth.io',
  'dateing.club',
  'gaming-at-my.best',
  'gamingfun.me',
  'headshot.monster',
  'imageshare.best',
  'locations.quest',
  'lovebird.guru',
  'minecräft.com',
  'mypic.icu',
  'otherhalf.life',
  'partpicker.shop',
  'progaming.monster',
  'shrekis.life',
  'sportshub.bar',
  'särahah.eu',
  'särahah.pl',
  'trulove.guru',
  'xda-developers.us',
  'yourmy.monster',
  'discörd.com',
  'disçordapp.com',
  'yoütu.be',
  // Other IP loggers
  'iplogger.org',
  'iplogger.com',
  'iplogger.ru',
  'ezstat.ru',
  '2no.co',
  '1urls.com',
  'iplis.ru',
  'ipgrabber.ru',
  'ip-tracker.org',
  'tracemyip.org',
  'iptrackeronline.com',
  'spylink.net',
  'blasze.com',
  'blasze.tk',
  'ps3cfw.com',
  'canary.is',
  'canarytokens.com',
  'webhook.site',
]);

export const isIpLoggerDomain = (domain: string): boolean => {
  const cleanDomain = domain.toLowerCase().trim();
  if (IP_LOGGER_DOMAINS.has(cleanDomain)) return true;

  // Check if subdomain of a known IP logger
  for (const loggerDomain of IP_LOGGER_DOMAINS) {
    if (cleanDomain.endsWith('.' + loggerDomain)) return true;
  }

  return false;
};

export const isDomainSafelisted = (domain: string): boolean => {
  const cleanDomain = domain.toLowerCase().trim();
  if (SAFELIST_DOMAINS.has(cleanDomain)) return true;

  for (const safeDomain of SAFELIST_DOMAINS) {
    if (cleanDomain.endsWith('.' + safeDomain)) return true;
  }

  return false;
};
