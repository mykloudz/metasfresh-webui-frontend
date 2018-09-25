describe('Test Introduce Window Tabs Internal Name; #4419 - https://github.com/metasfresh/metasfresh/issues/4491, #1926 - https://github.com/metasfresh/metasfresh-webui-frontend/issues/1926',  function() {
    before
  before(function() {
    // login before each test
    cy.loginByForm();
  });

    it ('Open bpartner window', function() {
      cy.visit('/window/123');
      cy.get('.cell-text-wrapper.text-cell')
        .contains('Test Kunde 1')
        .dblclick()

       // it ('Open tab using internal name', function() 
      cy.get('.nav-item[id="tab_Window-123-222"]')
        .click()
      });
    });
  

