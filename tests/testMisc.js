var chai = require('chai');
var chaiHttp = require('chai-http');
var fs = require('fs');

chai.use(chaiHttp);
var should = chai.should();

var app;

describe('Miscalleneous tests', () => {

	before(function (done){
		fs.rmdirSync('dummy/uploads', {recursive:true});
		require('../server/app', {})({
			input: [],
			flags: {destination: 'dummy/uploads', list: ''}
		})
		.then((generatedApp) => {
			app = generatedApp;
			done();
		});	
	});

	it('it should 404 for invalid paths - 1', (done) => {
		chai.request(app)
		.get('/dgzrt634')
		.end((err, res) => {
			res.should.have.property('status',404);
			done();
		});
	});

	it('it should 404 for invalid paths - 2', (done) => {
		chai.request(app)
		.post('/sdhxfg')
		.end((err, res) => {
			res.should.have.property('status',404);
			done();
		});
	});
	
	after(function(done) {
		delete require.cache[require.resolve('../server/app')];
		done();
	});
	
});
