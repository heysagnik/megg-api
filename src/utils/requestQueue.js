import logger from './logger.js';

class RequestQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
    }

    /**
     * Add a task to the queue
     * @param {Function} task - A function that returns a Promise
     * @returns {Promise} - Resolves when the task completes
     */
    add(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.process();
        });
    }

    async process() {
        if (this.isProcessing) return;
        if (this.queue.length === 0) return;

        this.isProcessing = true;
        const { task, resolve, reject } = this.queue.shift();

        try {
            const result = await task();
            resolve(result);
        } catch (error) {
            logger.error(`Queue task failed: ${error.message}`);
            reject(error);
        } finally {
            this.isProcessing = false;
            this.process();
        }
    }
}

// Export a singleton instance
export const requestQueue = new RequestQueue();
