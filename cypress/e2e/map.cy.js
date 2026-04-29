describe('Map Tab', () => {
  beforeEach(() => {
    cy.login()
    // Map is the default tab, but we can explicitly navigate to it to be sure
    cy.get('[data-cy="nav-map"]').click()
    cy.get('.leaflet-container').should('be.visible')
  })

  // ── Search Bar ───────────────────────────────────────────────────────────────

  it('renders the search bar', () => {
    cy.get('input[placeholder="חפש מיקום..."]').should('be.visible')
  })

  // ── Filter Chips ─────────────────────────────────────────────────────────────

  it('renders filter chips for all built-in categories', () => {
    cy.contains('button', 'הכל').should('be.visible')
    cy.contains('button', 'אוכל').should('be.visible')
    cy.contains('button', 'לינה').should('be.visible')
    cy.contains('button', 'טיול רגלי').should('be.visible')
    cy.contains('button', 'תחבורה').should('be.visible')
  })

  it('shows the "הכל" chip as active by default', () => {
    cy.contains('button', 'הכל').should('have.class', 'bg-primary-500')
  })

  it('clicking a category chip marks it active and deactivates הכל', () => {
    cy.contains('button', 'אוכל').click()
    cy.contains('button', 'אוכל').should('have.class', 'bg-primary-500')
    cy.contains('button', 'הכל').should('not.have.class', 'bg-primary-500')
  })

  // ── Map Interaction ─────────────────────────────────────────────────────────

  it('clicking the map opens the add attraction modal', () => {
    // Click somewhere on the map container
    cy.get('.leaflet-container').click(200, 200)

    // The modal should open
    cy.contains('h2', 'פרטי המקום').should('be.visible')
    cy.contains('המיקום נבחר (נעץ במפה)').should('be.visible')
    
    // Close the modal
    cy.get('.fixed.inset-0 button').first().click() // Close button is typically the first button in the header
    cy.contains('h2', 'פרטי המקום').should('not.exist')
  })
})
