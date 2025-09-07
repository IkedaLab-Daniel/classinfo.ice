import { useState, useCallback } from 'react';

const useApiWithLoading = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("Loading...");
    const [isServerWaking, setIsServerWaking] = useState(false);
    const [error, setError] = useState(null);

    const executeRequest = useCallback(async (apiCall, options = {}) => {
        const { 
            showLoading = true, 
            serverWakeThreshold = 3000,
            requestTimeout = 90000,
            loadingMessage: requestLoadingMessage = "Loading..."
        } = options;

        if (!showLoading) {
            try {
                return await apiCall();
            } catch (err) {
                setError(err.message);
                throw err;
            }
        }

        console.log('Starting API request with threshold:', serverWakeThreshold);
        setIsLoading(true);
        setLoadingMessage(requestLoadingMessage);
        setIsServerWaking(true);
        setError(null);

        const startTime = Date.now();
        let wakeTimer;
        let timeoutTimer;
        let isRequestCompleted = false;

        // Create the API call with timeout wrapper
        const apiCallWithTimeout = new Promise((resolve, reject) => {
            // Set up request timeout
            timeoutTimer = setTimeout(() => {
                if (!isRequestCompleted) {
                    isRequestCompleted = true;
                    reject(new Error('Request timeout - server may be unresponsive'));
                }
            }, requestTimeout);

            // Execute the actual API call
            apiCall()
                .then((result) => {
                    if (!isRequestCompleted) {
                        isRequestCompleted = true;
                        clearTimeout(timeoutTimer);
                        resolve(result);
                    }
                })
                .catch((error) => {
                    if (!isRequestCompleted) {
                        isRequestCompleted = true;
                        clearTimeout(timeoutTimer);
                        reject(error);
                    }
                });
        });

        // Set up server wake detection - only trigger if request is still pending
        wakeTimer = setTimeout(() => {
            if (!isRequestCompleted) {
                console.log('Request still pending after', serverWakeThreshold, 'ms - server likely sleeping');
                setIsServerWaking(true);
            }
        }, serverWakeThreshold);

        try {
            const result = await apiCallWithTimeout;
            
            // Calculate actual request duration
            const duration = Date.now() - startTime;
            console.log(`Request completed in ${duration}ms`);
            
            if (duration > serverWakeThreshold) {
                console.log(`Server was likely sleeping. Request took ${duration}ms`);
            }

            setError(null);
            return result;
        } catch (err) {
            console.log('Request failed:', err.message);
            setError(err.message);
            throw err;
        } finally {
            isRequestCompleted = true;
            if (wakeTimer) clearTimeout(wakeTimer);
            if (timeoutTimer) clearTimeout(timeoutTimer);
            console.log('Cleaning up loading states');
            setIsLoading(false);
            setIsServerWaking(false);
        }
    }, []);

    return {
        isLoading,
        loadingMessage,
        isServerWaking,
        showServerWaking: isServerWaking, // Keep backward compatibility
        error,
        executeRequest,
        clearError: () => setError(null)
    };
};

export default useApiWithLoading;
