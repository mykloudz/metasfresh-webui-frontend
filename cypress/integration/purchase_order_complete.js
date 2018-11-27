describe('HUEditor Test', function() {
  before(function() {
    cy.loginByForm();
  });

   const timestamp = new Date().getTime(); // used in the document names, for ordering
   
   it('Create a purchase order record', function() {
	    describe('Create a purchase order record', function() {
			cy.visit('/window/181/NEW');
			
			
			cy.writeIntoCompositeLookupField('C_BPartner_ID', 'G0002', 'G0002')
				
		
		 });
		
		 describe('Create order lines', function() {
            addOrderLine('P002737', '20');
		 });
		 
		 
		  describe('Comple Order', function() {
			  
			 cy.processDocument('Complete', 'Completed');
		  });
		 
  });
 
});

function addOrderLine(productValue, qty) {
    cy.pressAddNewButton();
    cy.writeIntoLookupListField('M_Product_ID', productValue, productValue);
	cy.clearStringField('QtyEntered');
    cy.writeIntoStringField('QtyEntered', qty+'{enter}');
    cy.pressDoneButton();
}




  
  