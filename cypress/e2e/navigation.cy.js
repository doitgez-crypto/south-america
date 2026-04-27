// Tests tab navigation after authentication.
// Uses programmatic login to skip the login UI.

describe('Tab Navigation', () => {
  beforeEach(() => {
    cy.login()
  })

  it('loads the map tab by default', () => {
    // The map container (Leaflet) should be present
    cy.get('.leaflet-container').should('exist')
    cy.get('[data-cy="nav-map"]').should('have.class', 'text-primary-600')
  })

  it('switches to the expenses tab', () => {
    cy.get('[data-cy="nav-expenses"]').click()
    // FAB button is unique to expenses tab
    cy.get('[aria-label="הוסף הוצאה"]').should('be.visible')
    cy.get('[data-cy="nav-expenses"]').should('have.class', 'text-primary-600')
  })

  it('switches to the list tab', () => {
    cy.get('[data-cy="nav-list"]').click()
    cy.get('[data-cy="nav-list"]').should('have.class', 'text-primary-600')
  })

  it('switches to the documents tab', () => {
    cy.get('[data-cy="nav-documents"]').click()
    cy.get('[data-cy="nav-documents"]').should('have.class', 'text-primary-600')
  })

  it('navigating between tabs preserves the active state', () => {
    cy.get('[data-cy="nav-expenses"]').click()
    cy.get('[data-cy="nav-map"]').click()
    cy.get('[data-cy="nav-map"]').should('have.class', 'text-primary-600')
    cy.get('[data-cy="nav-expenses"]').should('not.have.class', 'text-primary-600')
  })
})
