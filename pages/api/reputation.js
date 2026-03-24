// pages/api/reputation.js
// Scrapes live reputation data from Trustpilot, Google Places, and Airbnb
//
// Optional env vars:
//   GOOGLE_PLACES_API_KEY — for Google My Business rating via Places API
//   GOOGLE_PLACE_ID       — the place ID for the business on Google Maps

const TRUSTPILOT_URL = "https://uk.trustpilot.com/review/andsoul.com";
const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const GOOGLE_PLACE_ID = process.env.GOOGLE_PLACE_ID || "";
const AIRBNB_URL = process.env.AIRBNB_LISTING_URL || "";

async function fetchTrustpilot() {
  try {
    const res = await fetch(TRUSTPILOT_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-GB,en;q=0.9",
      },
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const html = await res.text();

    // Try JSON-LD first
    const jsonLdMatch = html.match(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatch) {
      for (const block of jsonLdMatch) {
        const jsonStr = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
        try {
          const data = JSON.parse(jsonStr);
          // Could be an array or single object
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item.aggregateRating) {
              return {
                rating: parseFloat(item.aggregateRating.ratingValue),
                count: parseInt(item.aggregateRating.reviewCount),
                source: "trustpilot-jsonld",
              };
            }
            if (item["@graph"]) {
              for (const node of item["@graph"]) {
                if (node.aggregateRating) {
                  return {
                    rating: parseFloat(node.aggregateRating.ratingValue),
                    count: parseInt(node.aggregateRating.reviewCount),
                    source: "trustpilot-jsonld-graph",
                  };
                }
              }
            }
          }
        } catch (e) { /* not valid JSON, skip */ }
      }
    }

    // Fallback: parse meta tags or common Trustpilot patterns
    // Trustpilot often has: <p class="typography_heading-m__..." data-rating-typography="true">3.5</p>
    const ratingMatch = html.match(/data-rating-typography[^>]*>(\d+\.?\d*)</);
    const countMatch = html.match(/(\d[\d,]*)\s*(?:total\s*)?reviews?/i);

    // Also try: <span class="...">TrustScore <strong>3.5</strong></span>
    const trustScoreMatch = html.match(/TrustScore\s*<[^>]*>(\d+\.?\d*)/i);

    const rating = ratingMatch ? parseFloat(ratingMatch[1]) :
                   trustScoreMatch ? parseFloat(trustScoreMatch[1]) : null;
    const count = countMatch ? parseInt(countMatch[1].replace(/,/g, "")) : null;

    if (rating !== null) {
      return { rating, count: count || 0, source: "trustpilot-html" };
    }

    // Last resort: look for "Rated X out of 5"
    const ratedMatch = html.match(/[Rr]ated\s+(\d+\.?\d*)\s+(?:out of|\/)\s*5/);
    if (ratedMatch) {
      return { rating: parseFloat(ratedMatch[1]), count: count || 0, source: "trustpilot-rated" };
    }

    return { error: "Could not parse rating from Trustpilot page" };
  } catch (err) {
    return { error: err.message };
  }
}

async function fetchGooglePlaces() {
  if (!GOOGLE_PLACES_KEY) return { error: "GOOGLE_PLACES_API_KEY not configured" };

  try {
    let placeId = GOOGLE_PLACE_ID;

    // If no place ID, search for it
    if (!placeId) {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=%26Soul+Southall+co-living&inputtype=textquery&fields=place_id&key=${GOOGLE_PLACES_KEY}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      if (searchData.candidates && searchData.candidates.length > 0) {
        placeId = searchData.candidates[0].place_id;
      } else {
        return { error: "Place not found on Google Maps" };
      }
    }

    // Get place details
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,name&key=${GOOGLE_PLACES_KEY}`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    if (detailsData.result) {
      return {
        rating: detailsData.result.rating || null,
        count: detailsData.result.user_ratings_total || 0,
        name: detailsData.result.name,
        source: "google-places-api",
      };
    }
    return { error: "No place details returned" };
  } catch (err) {
    return { error: err.message };
  }
}

async function fetchAirbnb() {
  if (!AIRBNB_URL) return { error: "AIRBNB_LISTING_URL not configured" };

  try {
    const res = await fetch(AIRBNB_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
      },
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const html = await res.text();

    // Try JSON-LD
    const jsonLdMatch = html.match(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatch) {
      for (const block of jsonLdMatch) {
        const jsonStr = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
        try {
          const data = JSON.parse(jsonStr);
          if (data.aggregateRating) {
            return {
              rating: parseFloat(data.aggregateRating.ratingValue),
              count: parseInt(data.aggregateRating.reviewCount),
              source: "airbnb-jsonld",
            };
          }
        } catch (e) { /* skip */ }
      }
    }

    // Try common Airbnb patterns in HTML
    const ratingMatch = html.match(/(\d+\.?\d*)\s*(?:·|•)\s*(\d+)\s*reviews?/i);
    if (ratingMatch) {
      return {
        rating: parseFloat(ratingMatch[1]),
        count: parseInt(ratingMatch[2]),
        source: "airbnb-html",
      };
    }

    return { error: "Could not parse Airbnb rating" };
  } catch (err) {
    return { error: err.message };
  }
}

export default async function handler(req, res) {
  try {
    const [trustpilot, google, airbnb] = await Promise.all([
      fetchTrustpilot(),
      fetchGooglePlaces(),
      fetchAirbnb(),
    ]);

    return res.status(200).json({
      trustpilot,
      google,
      airbnb,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Reputation API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
