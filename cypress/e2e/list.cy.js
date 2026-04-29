// Tests the List tab: filter chips, search, and attraction count badge.
// Does not test attraction CRUD (requires geocoding) — that belongs in a dedicated spec.

describe('List Tab', () => {
  beforeEach(() => {
    cy.login()
    cy.get('[data-cy="nav-list"]').click()
    // Wait for the tab to finish loading
    cy.get('input[placeholder="חפש מקום..."]').should('be.visible')
  })

  // ── Filter chips ──────────────────────────────────────────────────────────────

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

  it('clicking הכל after a filter resets the active chip', () => {
    cy.contains('button', 'לינה').click()
    cy.contains('button', 'הכל').click()
    cy.contains('button', 'הכל').should('have.class', 'bg-primary-500')
    cy.contains('button', 'לינה').should('not.have.class', 'bg-primary-500')
  })

  // ── Count badge ───────────────────────────────────────────────────────────────

  it('shows the attraction count badge', () => {
    cy.contains('מקומות').should('be.visible')
  })

  // ── Search ────────────────────────────────────────────────────────────────────

  it('typing a nonsense string shows the empty state', () => {
    cy.get('input[placeholder="חפש מקום..."]').type('zzz_cypress_test_xyz')
    cy.contains('אין מקומות עדיין').should('be.visible')
  })

  it('clearing the search hides the empty state and shows the count badge again', () => {
    cy.get('input[placeholder="חפש מקום..."]').type('zzz_cypress_test_xyz')
    cy.contains('אין מקומות עדיין').should('be.visible')
    cy.get('input[placeholder="חפש מקום..."]').clear()
    cy.contains('מקומות').should('be.visible')
    cy.contains('אין מקומות עדיין').should('not.exist')
  })
})
