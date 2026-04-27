// Tests the login UI itself — do NOT use cy.login() here, that would bypass what we're testing.

describe('Authentication', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/')
  })

  it('shows the login form when not authenticated', () => {
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.contains('button', 'כניסה').should('be.visible')
  })

  it('shows a Hebrew error message for wrong credentials', () => {
    cy.get('input[type="email"]').type('wrong@example.com')
    cy.get('input[type="password"]').type('wrongpassword')
    cy.contains('button', 'כניסה').click()
    cy.contains('שם משתמש או סיסמה שגויים').should('be.visible')
  })

  it('navigates to the app after successful login', () => {
    cy.get('input[type="email"]').type(Cypress.env('TEST_EMAIL'))
    cy.get('input[type="password"]').type(Cypress.env('TEST_PASSWORD'))
    cy.contains('button', 'כניסה').click()
    // Bottom nav appears once authenticated
    cy.get('[data-cy="nav-map"]').should('be.visible')
    cy.get('[data-cy="nav-expenses"]').should('be.visible')
  })

  it('shows the login form again after the page is visited with no session', () => {
    cy.clearLocalStorage()
    cy.reload()
    cy.get('input[type="email"]').should('be.visible')
  })
})
