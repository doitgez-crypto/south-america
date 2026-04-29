// Tests the Expenses tab summary card and ARS blue-dollar toggle.
// These are independent of the CRUD flow tested in expenses.cy.js.

describe('Expenses Summary and ARS Blue Dollar Toggle', () => {
  beforeEach(() => {
    cy.login()
    cy.get('[data-cy="nav-expenses"]').click()
    cy.get('[aria-label="הוסף הוצאה"]').should('be.visible')
  })

  // ── Summary card ──────────────────────────────────────────────────────────────

  it('shows the summary card with USD and ILS labels', () => {
    cy.contains('סה"כ הוצאות').should('be.visible')
    cy.contains('דולר').should('be.visible')
    cy.contains('שקל').should('be.visible')
  })

  it('summary card shows a numeric dollar total', () => {
    // Wait for currency to finish loading, then the "$X.XX" amount appears
    cy.contains('דולר').should('be.visible')
    cy.contains(/\$\d+\.\d\d/).should('be.visible')
  })

  // ── ARS blue-dollar toggle ────────────────────────────────────────────────────

  it('shows the blue-dollar section header', () => {
    cy.contains('שער הדולר הכחול').should('be.visible')
    cy.contains('ארגנטינה').should('be.visible')
  })

  it('expanding the toggle reveals the rate input and on/off switch', () => {
    cy.contains('שער הדולר הכחול').click()
    cy.contains('השתמש בשער הכחול').should('be.visible')
    cy.contains('ARS/$').should('be.visible')
    // The rate input is a number field
    cy.get('input[type="number"][dir="ltr"]').should('be.visible')
  })

  it('toggling the switch flips the active state text in the header', () => {
    cy.contains('שער הדולר הכחול').click()

    // Read the current header subtitle to know the initial state
    cy.contains('ארגנטינה')
      .invoke('text')
      .then((initialText) => {
        // Click the on/off switch
        cy.contains('השתמש בשער הכחול')
          .parent()
          .find('button')
          .click()

        // The subtitle should now show the opposite state
        cy.contains('ארגנטינה')
          .invoke('text')
          .should('not.equal', initialText)
      })
  })

  it('collapsing the toggle hides the rate input', () => {
    cy.contains('שער הדולר הכחול').click() // expand
    cy.contains('השתמש בשער הכחול').should('be.visible')
    cy.contains('שער הדולר הכחול').click() // collapse
    cy.contains('השתמש בשער הכחול').should('not.exist')
  })
})
