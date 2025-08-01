import { useState, useCallback } from 'react';

const useApiWithLoading = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("Loading...");
    const [isServerWaking, setIsServerWaking] = useState(false);
    const [error, setError] = useState(null);

    const executeRequest = useCallback(async (apiCall, options = {}) => {
        const { 
            showLoading = true, 
            serverWakeThreshold = 5000, // 5 seconds
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

        setIsLoading(true);
        setLoadingMessage(requestLoadingMessage);
        setIsServerWaking(false);
        setError(null);

        const startTime = Date.now();

        // Set up server wake detection
        const wakeTimer = setTimeout(() => {
            setIsServerWaking(true);
        }, serverWakeThreshold);

        try {
            const result = await apiCall();
            clearTimeout(wakeTimer);
            
            // If the request took longer than threshold, it was likely a cold start
            const duration = Date.now() - startTime;
            if (duration > serverWakeThreshold) {
                console.log(`Server was likely sleeping. Request took ${duration}ms`);
            }

            setError(null);
            return result;
        } catch (err) {
            clearTimeout(wakeTimer);
            setError(err.message);
            throw err;
        } finally {
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
