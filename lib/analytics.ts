// Google Analytics 4 Event Tracking Utilities
// Usage: import { trackSignup, trackLogin } from '@/lib/analytics';

type GAEventParams = {
    action: string;
    category: string;
    label?: string;
    value?: number;
    [key: string]: string | number | boolean | undefined;
};

/**
 * Track a custom event in GA4
 */
export function trackEvent({ action, category, label, value, ...rest }: GAEventParams) {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value,
        ...rest,
    });
}

// ============================================================================
// AUTH EVENTS
// ============================================================================

/** Track user signup */
export function trackSignup(method: string = 'email') {
    trackEvent({ action: 'sign_up', category: 'auth', label: method });
}

/** Track user login */
export function trackLogin(method: string = 'email') {
    trackEvent({ action: 'login', category: 'auth', label: method });
}

/** Track user logout */
export function trackLogout() {
    trackEvent({ action: 'logout', category: 'auth' });
}

// ============================================================================
// WORKBOOK EVENTS
// ============================================================================

/** Track when values worksheet is saved */
export function trackValuesSaved(count: number) {
    trackEvent({ action: 'save_values', category: 'workbook', label: 'values', value: count });
}

/** Track when interests worksheet is saved */
export function trackInterestsSaved(existingCount: number, exploringCount: number) {
    trackEvent({
        action: 'save_interests',
        category: 'workbook',
        label: 'interests',
        value: existingCount + exploringCount,
    });
}

/** Track when life categories worksheet is saved */
export function trackCategoriesSaved(count: number) {
    trackEvent({ action: 'save_categories', category: 'workbook', label: 'life_categories', value: count });
}

/** Track when LifeFrame is completed (all 3 worksheets done) */
export function trackLifeFrameComplete() {
    trackEvent({ action: 'complete_lifeframe', category: 'workbook', label: 'lifeframe' });
}

// ============================================================================
// ROADMAP EVENTS
// ============================================================================

/** Track when a goal/activity is added to the roadmap */
export function trackGoalAdded(category: string, type: string = 'goal') {
    trackEvent({ action: 'add_goal', category: 'roadmap', label: `${category}:${type}` });
}

/** Track when roadmap is saved */
export function trackRoadmapSaved(goalCount: number) {
    trackEvent({ action: 'save_roadmap', category: 'roadmap', value: goalCount });
}

/** Track when roadmap is fully complete */
export function trackRoadmapComplete(goalCount: number) {
    trackEvent({ action: 'complete_roadmap', category: 'roadmap', value: goalCount });
}

/** Track activity logging in roadmap */
export function trackActivityLogged(category: string) {
    trackEvent({ action: 'log_activity', category: 'roadmap', label: category });
}

// ============================================================================
// TODO EVENTS
// ============================================================================

/** Track todo creation */
export function trackTodoCreated(source: string = 'manual') {
    trackEvent({ action: 'create_todo', category: 'todo', label: source });
}

/** Track todo completion */
export function trackTodoCompleted() {
    trackEvent({ action: 'complete_todo', category: 'todo' });
}

// ============================================================================
// ENGAGEMENT EVENTS
// ============================================================================

/** Track LifeFrame print */
export function trackPrintLifeFrame() {
    trackEvent({ action: 'print_lifeframe', category: 'engagement' });
}

/** Track Roadmap print */
export function trackPrintRoadmap() {
    trackEvent({ action: 'print_roadmap', category: 'engagement' });
}

// Legacy object-based API (for backward compatibility)
export const analytics = {
    signUp: () => trackSignup(),
    login: () => trackLogin(),
    logout: trackLogout,
    completeWorksheet: (worksheet: string) =>
        trackEvent({ action: 'complete_worksheet', category: 'workbook', label: worksheet }),
    saveWorksheet: (worksheet: string) =>
        trackEvent({ action: 'save_worksheet', category: 'workbook', label: worksheet }),
    createGoal: (category: string) => trackGoalAdded(category),
    completeActivity: (goalCategory: string) =>
        trackEvent({ action: 'complete_activity', category: 'roadmap', label: goalCategory }),
    logActivity: (goalCategory: string) => trackActivityLogged(goalCategory),
    addTodo: () => trackTodoCreated(),
    completeTodo: trackTodoCompleted,
    viewPage: (page: string) =>
        trackEvent({ action: 'page_view', category: 'navigation', label: page }),
    printLifeFrame: trackPrintLifeFrame,
    printRoadmap: trackPrintRoadmap,
};
