// PostHog web analytics for pocketpiggy.app, loaded in the <head> of every
// page. Cookieless: no cookies, no localStorage or sessionStorage, no
// session recording. Sends to the same "Pocket Piggy" project as the iOS
// app; every web event carries platform=web so the two are easy to separate.

// Official PostHog loader snippet. It loads the SDK from PostHog's asset
// host (us-assets.i.posthog.com), derived from api_host below.
!function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

posthog.init('phc_ycKrFAMe7faTMQUdXWowKkBUotArxrvKpLKrPi9Nzw7D', {
  api_host: 'https://us.i.posthog.com',
  defaults: '2025-05-24',
  cookieless_mode: 'always',
  person_profiles: 'identified_only',
  disable_session_recording: true,
  capture_pageview: true,
  capture_pageleave: true,
  autocapture: true
});
posthog.register({ platform: 'web', site: 'pocketpiggy.app' });

// One delegated listener for every link to Pocket Piggy's App Store listing,
// and for the printable chore chart downloads.
// Placement comes from data-placement, else the nearest section id, else
// where the link sits on the page. sendBeacon lets the event go out while
// the browser navigates away, so the click is never held up.
document.addEventListener('click', function (e) {
  // Printable chore chart PDFs: which age, paper and kind (never any names).
  var pdf = e.target.closest && e.target.closest('a[data-printable]');
  if (pdf) {
    posthog.capture('printable_download', { age: pdf.getAttribute('data-age'), paper: pdf.getAttribute('data-paper'), kind: pdf.getAttribute('data-kind') }, { transport: 'sendBeacon' });
    return;
  }
  var link = e.target.closest && e.target.closest('a[href*="apps.apple.com"]');
  if (!link || link.href.indexOf('id6757681260') === -1) return;  // our app only, not source links to other apps
  var section = link.closest('section[id]');
  var placement = link.getAttribute('data-placement') ||
    (section && section.id) ||
    (link.closest('header') ? 'nav' : link.closest('footer') ? 'footer' : 'hero');
  posthog.capture('app_store_click', { page: location.pathname, placement: placement }, { transport: 'sendBeacon' });
}, true);
