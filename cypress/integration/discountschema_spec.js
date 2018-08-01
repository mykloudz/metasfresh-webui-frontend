describe('New subscription flatrate conditions Test', function() {
    before(function() {
        // login before each test
        cy.loginByForm();
    });

    const discountschemaName = `Cypress Test ${new Date().getTime()}`;

    it('Create a discount schema record', function() {
        describe('Create a new discount schema record', function() {
            cy.visit('/window/233/NEW');

            cy.writeIntoStringField('Name', `${discountschemaName}`);
            cy.writeIntoListField('DiscountType', 'B', 'Breaks');

            // making this work is the primary goal of this issue; might need another command to be created
            cy.writeIntoStringField('ValidFrom', '01.01.2018{enter}');
        });

        /*
        For bonus points, uncomment and make it work too ;-) ...but might also be an issue of its own
        describe('Create add a break record', function() {
            const addNewText = Cypress.messages.window.addNew.caption;

            cy.get('.tabs-wrapper .form-flex-align .btn')
                .contains(addNewText)
                .should('exist')
                .click();
            cy.writeIntoListField('M_Product_ID', 'Co', 'P002737');    
            cy.writeIntoStringField('BreakValue', '10');
            cy.writeIntoStringField('BreakDiscount', '20');
        });
        */
    });

});
