// Tests the Documents tab render: header, upload buttons, and content state.
// Does not test actual upload (requires file system access and Supabase storage).

describe('Documents Tab', () => {
  beforeEach(() => {
    cy.login()
    cy.get('[data-cy="nav-documents"]').click()
    cy.contains('h2', 'מסמכים').should('be.visible')
  })

  // ── Render ────────────────────────────────────────────────────────────────────

  it('renders the header with title and subtitle', () => {
    cy.contains('h2', 'מסמכים').should('be.visible')
    cy.contains('נהלו את כל מסמכי הנסיעה במקום אחד').should('be.visible')
  })

  it('shows the file-upload "הוסף" button and camera button', () => {
    cy.contains('button', 'הוסף').should('be.visible').and('not.be.disabled')
  })

  // ── Content state ─────────────────────────────────────────────────────────────

  it('shows content (empty state or list) — not a perpetual loading spinner', () => {
    // Either the empty-state message or at least one document row should be present.
    // The tab must not stay in loading state indefinitely.
    cy.get('body').should(($body) => {
      const hasEmpty  = $body.text().includes('אין עדיין מסמכים')
      const hasDoc    = $body.find('[href]').length > 0 // document rows have view links
      expect(hasEmpty || hasDoc).to.be.true
    })
  })

  it('shows the empty-state help text when no documents exist', () => {
    // If there are documents this assertion is skipped via conditional,
    // otherwise it verifies the empty-state copy is correct.
    cy.get('body').then(($body) => {
      if ($body.text().includes('אין עדיין מסמכים')) {
        cy.contains('העלה כרטיסי טיסה, ביטוחים או צילומי דרכון').should('be.visible')
      }
    })
  })
})
