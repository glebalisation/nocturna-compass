import { Collected, SourceRow } from './types';
import { collectJsonLd } from './jsonld';
import { collectIcs } from './ics';
import { collect19hz } from './nineteenhz';
import { collectEdmtrain } from './edmtrain';
import { collectRA } from './ra';
import { collectFacebookGraph, collectFacebookApify } from './facebook';

const UA = { 'User-Agent': 'NocturnaCompassBot/1.0 (LA event guide; contact via site)' };

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
  return res.text();
}

/** Run the right collector for a source row. Never throws — returns []. */
export async function runSource(src: SourceRow): Promise<Collected[]> {
  try {
    switch (src.kind) {
      case 'jsonld':      // DoLA, DICE pages, Eventbrite pages, Shotgun, venue sites
      case 'dice':
      case 'dola':
      case 'shotgun':
      case 'eventbrite':  // Eventbrite public pages embed JSON-LD; official API optional later
        return collectJsonLd(await fetchText(src.url), src.url);
      case 'ics':
        return collectIcs(await fetchText(src.url));
      case '19hz':
        return collect19hz(await fetchText(src.url), src.url);
      case 'edmtrain':
        return collectEdmtrain();
      case 'ra':
        return collectRA();
      case 'facebook':
        // url is a page id/username → Graph API; full URL → Apify
        return src.url.startsWith('http')
          ? collectFacebookApify(src.url)
          : collectFacebookGraph(src.url);
      case 'instagram':
        // No compliant generic path: IG Graph API only reads accounts that
        // authorized your app. Add promoter flyers manually or via submissions.
        return [];
      default:
        return [];
    }
  } catch (err) {
    console.error(`collector ${src.kind} (${src.name}) failed:`, err);
    return [];
  }
}
