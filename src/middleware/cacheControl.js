/**
 * Middleware to set Cache-Control headers for Vercel Edge Caching.
 *
 * @param {number} sMaxAge - Time in seconds the response is considered fresh by the CDN (s-maxage).
 * @param {number} staleWhileRevalidate - Time in seconds the CDN can serve stale content while updating in the background.
 */
export const publicCache = (sMaxAge = 60, staleWhileRevalidate = 300) => {
  return (req, res, next) => {
    // only cache GET requests
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
    }
    next();
  };
};
