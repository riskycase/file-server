// A simple test to verify a visible window is opened with a title
var Application = require('spectron').Application
var chai = require('chai');
var path = require('path');


var should = chai.should()


var app = new Application({
  path: path.resolve(__dirname, '../index.js')
})

describe('Electron test', () =>{
	
	it('it should pass test', (done) => {
		app.start()
		.then(() => {
			app.browserWindow.isVisible.should.equal(true);
			done();
		})
	})
	
})
