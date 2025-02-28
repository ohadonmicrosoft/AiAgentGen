module.exports = {
  ci: {
    collect: {
      /* The local server for the web app to be tested */
      url: ['http://localhost:3000/'],
      /* Use desktop configuration */
      settings: {
        preset: 'desktop',
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],
        skipAudits: ['uses-http2'],
      },
      /* Number of times to run Lighthouse */
      numberOfRuns: 3,
    },
    upload: {
      /* Upload the results to temporary public storage */
      target: 'temporary-public-storage',
    },
    assert: {
      /* Performance thresholds */
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        interactive: ['warn', { maxNumericValue: 3500 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
  },
};
