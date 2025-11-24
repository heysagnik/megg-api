import { requestQueue } from '../utils/requestQueue.js';

/**
 * Middleware to execute requests sequentially.
 * Use ONLY for critical write operations to prevent race conditions.
 */
export const sequentialWrite = async (req, res, next) => {

    requestQueue.add(() => {
        return new Promise((resolve) => {
            res.on('finish', () => {
                resolve();
            });

            res.on('close', () => {
                resolve();
            });

            next();
        });
    }).catch(err => {
        next(err);
    });
};
