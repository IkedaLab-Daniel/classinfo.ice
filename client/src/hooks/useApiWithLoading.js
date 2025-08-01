import { useState, useCallback } from 'react';

const useApiWithLoading = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("Loading...");
    const [isServerWaking, setIsServerWaking] = useState(false);
    const [error, setError] = useState(null);

    const executeRequest = useCallback(async (apiCall, options = {}) => {
        const { 
            showLoading = true, 
            serverWakeThreshold = 2000, // Reduced to 2 seconds for easier testing
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
        setIsServerWaking(false);
        setError(null);

        const startTime = Date.now();

        // Set up server wake detection
        const wakeTimer = setTimeout(() => {
            console.log('Wake timer triggered - showing server waking message');
            setIsServerWaking(true);
        }, serverWakeThreshold);

        try {
            const result = await apiCall();
            clearTimeout(wakeTimer);
            
            // If the request took longer than threshold, it was likely a cold start
            const duration = Date.now() - startTime;
            console.log(`Request completed in ${duration}ms`);
            if (duration > serverWakeThreshold) {
                console.log(`Server was likely sleeping. Request took ${duration}ms`);
            }

            setError(null);
            return result;
        } catch (err) {
            clearTimeout(wakeTimer);
            console.log('Request failed:', err.message);
            setError(err.message);
            throw err;
        } finally {
            console.log('Cleaning up loading states');
            setIsLoading(false);
            setIsServerWaking(false);
        }
    }, []);

    return {
        isLoading,
        loadingMessage,
        showServerWaking: isServerWaking,
        error,
        executeRequest,
        clearError: () => setError(null)
    };
};

export default useApiWithLoading;
