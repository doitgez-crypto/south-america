const PROJECT_ID = 'tblppttmjzthnolnzrjr'
const TOKEN_KEY = `sb-${PROJECT_ID}-auth-token`

// Programmatic login via the app's own UI form.
// Uses the same flow as auth.cy.js test 3, which is known to work.
// Avoids direct Supabase API calls so the key format in cypress.env.json doesn't matter.
Cypress.Commands.add('login', () => {
  cy.clearLocalStorage()
  cy.visit('/')
  cy.get('input[type="email"]').type(Cypress.env('TEST_EMAIL'))
  cy.get('input[type="password"]').type(Cypress.env('TEST_PASSWORD'))
  cy.contains('button', 'כניסה').click()
  // Wait until authenticated (nav appears)
  cy.get('[data-cy="nav-map"]').should('be.visible')
  // Extract the access token for use in cleanup commands
  cy.window().then((win) => {
    const raw = win.localStorage.getItem(TOKEN_KEY)
    if (raw) {
      const session = JSON.parse(raw)
      Cypress.env('ACCESS_TOKEN', session.access_token)
    }
  })
})

// Soft-deletes all expenses whose title matches a LIKE pattern.
// Requires cy.login() first so ACCESS_TOKEN is available.
Cypress.Commands.add('cleanupTestExpenses', (titlePattern = '%[CYPRESS]%') => {
  cy.request({
    method: 'PATCH',
    url: `${Cypress.env('SUPABASE_URL')}/rest/v1/expenses?title=like.${encodeURIComponent(titlePattern)}`,
    headers: {
      apikey: Cypress.env('SUPABASE_ANON_KEY'),
      Authorization: `Bearer ${Cypress.env('ACCESS_TOKEN')}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: { is_deleted: true },
    failOnStatusCode: false,
  })
})
