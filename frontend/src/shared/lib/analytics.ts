type EventName = 
  | 'app_opened'
  | 'city_selected'
  | 'solo_started'
  | 'solo_finished'
  | 'duel_started'
  | 'duel_finished'
  | 'leaderboard_opened'
  | 'question_reported';

export const analytics = {
  logEvent: (name: EventName, params?: Record<string, any>) => {
    // console.log(`[Analytics] ${name}`, params);
    // Future: Firebase Analytics integration
    // if (typeof window !== 'undefined' && (window as any).gtag) {
    //   (window as any).gtag('event', name, params);
    // }
  }
};
