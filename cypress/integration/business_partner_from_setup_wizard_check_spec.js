describe('Business partner window widgets test', function() {
  before(function() {
    // login before each test
    cy.loginByForm();
  });

  context('Tabs', function() {
    beforeEach(function() {
      cy.visit('/window/123/2155894');
      cy
        .get('.header-breadcrumb-sitename')  // note: probably needs to be changed
        .should('contain', 'testfirmaWebUI');
    });

    context('Vendor', function() {
      it('Check if list widget works properly', function() {
        cy
          .get('.header-breadcrumb-sitename')
          .should('contain', 'testfirmaWebUI');

        cy
          .get('0') //Search Key
          .should('contain', 'testfirmaWebUI');

        cy
          .get('Name')
          .should('contain', 'testfirmaWebUI');

        cy
          .get('Organisation')
          .should('contain', 'testfirmaWebUI');
      });
    });
  });
});
