// Tests image upload behavior in AddAttractionModal.
// Supabase Storage network calls are intercepted so tests run without real storage access.

// A 1×1 pixel transparent PNG — smallest valid image for triggering the upload flow.
const TINY_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

function attachImage() {
  cy.get('[data-cy="image-file-input"]').selectFile(
    {
      contents: Cypress.Buffer.from(TINY_PNG, 'base64'),
      fileName: 'test.png',
      mimeType: 'image/png',
    },
    { force: true }
  )
}

describe('Image Upload in Add Attraction Modal', () => {
  beforeEach(() => {
    cy.login()
    // Open the modal via the FAB — available on the list tab
    cy.get('[data-cy="nav-list"]').click()
    cy.get('input[placeholder="חפש מקום..."]').should('be.visible')
    cy.get('[aria-label="Add new attraction"]').click()
    cy.contains('פרטי המקום').should('be.visible')
  })

  it('image upload input is present in the modal', () => {
    cy.get('[data-cy="image-file-input"]').should('exist')
  })

  it('shows uploading state while the storage request is in flight', () => {
    cy.intercept('**/storage/v1/object/**', (req) => {
      req.reply({ delay: 3000, statusCode: 200, body: {} })
    })

    attachImage()

    // The save button changes to "מעלה..." while uploading is true
    cy.contains('button', 'מעלה...').should('be.visible')
  })

  it('save button is disabled while upload is in progress', () => {
    cy.intercept('**/storage/v1/object/**', (req) => {
      req.reply({ delay: 3000, statusCode: 200, body: {} })
    })

    // Enter a name so the button would otherwise be enabled
    cy.get('input[placeholder="איפה תרצו לבקר?"]').type('מקום בדיקה')
    attachImage()

    cy.get('[data-cy="save-attraction-btn"]').should('be.disabled')
  })

  it('shows an error toast when the storage upload fails', () => {
    cy.intercept('**/storage/v1/object/**', {
      statusCode: 400,
      body: { message: 'הרשאות אחסון נכשלו', error: 'permission denied' },
    })

    attachImage()

    cy.contains(/העלאת תמונה נכשלה/).should('be.visible')
  })

  it('upload loading state clears after the request finishes', () => {
    cy.intercept('**/storage/v1/object/**', (req) => {
      req.reply({ delay: 500, statusCode: 200, body: {} })
    })

    attachImage()

    // After the (fast) upload completes, the button should revert to "שמור"
    cy.contains('button', 'שמור').should('be.visible')
  })
})
