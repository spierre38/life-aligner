// Type declarations for Google Analytics gtag
interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
}
