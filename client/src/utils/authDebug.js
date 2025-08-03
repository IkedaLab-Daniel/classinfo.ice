// Debug utility for production authentication issues
export const debugAuth = {
    // Log all environment variables (safely)
    logEnvironment: () => {
        console.log('=== Environment Debug ===');
        console.log('Build time:', new Date().toISOString());
        console.log('User Agent:', navigator.userAgent);
        console.log('Location:', window.location.href);
        
        // Vite environment
        console.log('Vite Environment:');
        Object.keys(import.meta.env).forEach(key => {
            if (key.startsWith('VITE_')) {
                const value = import.meta.env[key];
                // Don't log sensitive values, just their existence and length
                if (key.includes('PASSWORD') || key.includes('SECRET') || key.includes('KEY')) {
                    console.log(`- ${key}: [EXISTS: ${!!value}, LENGTH: ${value ? value.length : 0}]`);
                } else {
                    console.log(`- ${key}: ${value}`);
                }
            }
        });
        
        // Browser capabilities
        console.log('Browser Support:');
        console.log('- localStorage:', typeof Storage !== 'undefined' && !!window.localStorage);
        console.log('- sessionStorage:', typeof Storage !== 'undefined' && !!window.sessionStorage);
        console.log('- Console available:', typeof console !== 'undefined');
        
        console.log('=== End Environment Debug ===');
    },
    
    // Test environment variable access
    testEnvVar: (varName) => {
        console.log(`=== Testing ${varName} ===`);
        const value = import.meta.env[varName];
        console.log('- Variable exists:', !!value);
        console.log('- Variable type:', typeof value);
        console.log('- Variable length:', value ? value.length : 0);
        console.log('- Is string:', typeof value === 'string');
        console.log('- Is empty string:', value === '');
        console.log('- Is undefined:', value === undefined);
        console.log('- Is null:', value === null);
        console.log(`=== End Testing ${varName} ===`);
        return value;
    },
    
    // Test session storage
    testSessionStorage: () => {
        console.log('=== Testing Session Storage ===');
        try {
            // Test write
            sessionStorage.setItem('test_key', 'test_value');
            const retrieved = sessionStorage.getItem('test_key');
            console.log('- Write/Read test:', retrieved === 'test_value' ? 'PASS' : 'FAIL');
            
            // Test timestamps
            const timestamp = Date.now().toString();
            sessionStorage.setItem('test_timestamp', timestamp);
            const retrievedTimestamp = sessionStorage.getItem('test_timestamp');
            console.log('- Timestamp test:', retrievedTimestamp === timestamp ? 'PASS' : 'FAIL');
            
            // Cleanup
            sessionStorage.removeItem('test_key');
            sessionStorage.removeItem('test_timestamp');
            
            console.log('- Session storage fully functional');
        } catch (error) {
            console.error('- Session storage error:', error);
        }
        console.log('=== End Testing Session Storage ===');
    }
};

// Auto-run debug on import in development or when explicitly requested
if (import.meta.env.DEV || window.location.search.includes('debug=true')) {
    console.log('🐛 Auth Debug Mode Activated');
    debugAuth.logEnvironment();
    debugAuth.testSessionStorage();
}
