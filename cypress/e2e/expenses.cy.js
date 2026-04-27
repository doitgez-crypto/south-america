// Full CRUD flow for expenses.
// All test items use the [CYPRESS] prefix so cy.cleanupTestExpenses() can find them.

const TEST_TITLE = '[CYPRESS] ארוחת בוקר'
const EDITED_TITLE = '[CYPRESS] ארוחת בוקר - ערוך'

describe('Expenses', () => {
  before(() => {
    // Programmatic login once — token is valid for the entire spec file
    cy.login()
    cy.cleanupTestExpenses()
  })

  beforeEach(() => {
    cy.login()
    cy.get('[data-cy="nav-expenses"]').click()
    // Wait for the expenses list to finish loading from Supabase
    cy.get('[aria-label="הוסף הוצאה"]').should('be.visible')
  })

  after(() => {
    cy.cleanupTestExpenses()
  })

  // ── Add ───────────────────────────────────────────────────────────────────────

  it('adds a new expense and shows it in the list', () => {
    cy.get('[aria-label="הוסף הוצאה"]').click()
    cy.get('input[type="number"]').type('42.50')
    cy.get('input[placeholder="מה קנינו?"]').type(TEST_TITLE)
    cy.contains('button', 'שמור הוצאה').click()

    // Modal should close and the new expense should appear
    cy.contains('button', 'שמור הוצאה').should('not.exist')
    cy.get('[data-cy="expense-title"]').contains(TEST_TITLE).should('be.visible')
    cy.contains('ההוצאה נשמרה!').should('be.visible')
  })

  // ── Edit ──────────────────────────────────────────────────────────────────────

  it('edits an existing expense and shows the updated title', () => {
    // Find the test expense and click its edit button
    cy.get('[data-cy="expense-item"]')
      .contains(TEST_TITLE)
      .closest('[data-cy="expense-item"]')
      .find('[data-cy="expense-edit-btn"]')
      .click()

    // Modal opens pre-filled — clear the title field and type the new one
    cy.get('input[placeholder="מה קנינו?"]').clear().type(EDITED_TITLE)
    cy.contains('button', 'שמור הוצאה').click()
    cy.contains('button', 'שמור הוצאה').should('not.exist')
    cy.contains('ההוצאה עודכנה!').should('be.visible')

    // Use exact regex matching (escaped) to avoid substring match issues
    cy.contains('[data-cy="expense-title"]', /^\[CYPRESS\] ארוחת בוקר - ערוך$/).should('be.visible')
    cy.contains('[data-cy="expense-title"]', /^\[CYPRESS\] ארוחת בוקר$/).should('not.exist')
  })

  // ── Currency ──────────────────────────────────────────────────────────────────

  it('allows adding an expense in ARS and shows the blue-dollar info tip', () => {
    cy.get('[aria-label="הוסף הוצאה"]').click()
    cy.get('select').first().select('ARS')
    cy.contains('דולר כחול').should('be.visible')
    cy.contains('button', 'ביטול').click()
  })

  // ── Validation ────────────────────────────────────────────────────────────────

  it('does not submit the form when amount is empty', () => {
    cy.get('[aria-label="הוסף הוצאה"]').click()
    // Leave amount empty, try to submit
    cy.contains('button', 'שמור הוצאה').click()
    // Modal should still be open (browser validation or our guard)
    cy.contains('button', 'שמור הוצאה').should('be.visible')
    cy.contains('button', 'ביטול').click()
  })

  // ── Delete ────────────────────────────────────────────────────────────────────

  it('deletes an expense after confirming', () => {
    cy.get('[data-cy="expense-item"]')
      .contains(EDITED_TITLE)
      .closest('[data-cy="expense-item"]')
      .find('[data-cy="expense-delete-btn"]')
      .click()

    // Inline confirmation banner
    cy.contains('למחוק הוצאה זו?').should('be.visible')
    cy.get('[data-cy="expense-confirm-delete"]').click()

    cy.contains('[data-cy="expense-title"]', /^\[CYPRESS\] ארוחת בוקר - ערוך$/).should('not.exist')
  })

  it('cancels deletion when clicking ביטול in the confirmation', () => {
    // First add a fresh expense to test cancel-delete on
    cy.get('[aria-label="הוסף הוצאה"]').click()
    cy.get('input[type="number"]').type('10')
    cy.get('input[placeholder="מה קנינו?"]').type(TEST_TITLE)
    cy.contains('button', 'שמור הוצאה').click()
    cy.get('[data-cy="expense-title"]').contains(TEST_TITLE).should('be.visible')

    cy.get('[data-cy="expense-item"]')
      .contains(TEST_TITLE)
      .closest('[data-cy="expense-item"]')
      .find('[data-cy="expense-delete-btn"]')
      .click()

    cy.contains('למחוק הוצאה זו?').should('be.visible')
    cy.contains('button', 'ביטול').last().click()

    // Expense should still be in the list
    cy.get('[data-cy="expense-title"]').contains(TEST_TITLE).should('be.visible')
  })
})
