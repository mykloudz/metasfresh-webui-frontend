describe('Create New Product', function() {
  before(function() {
    // login before each test
    cy.loginByForm();
  });

  context('Tabs', function() {
    beforeEach(function() {
      cy.visit('/window/140/2005598');
      cy
        .get('.header-breadcrumb-sitename')
        .should('contain', '1000001');
    });
  });
})
