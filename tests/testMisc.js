var chai = require('chai');
var chaiHttp = require('chai-http');
var fs = require('fs');

chai.use(chaiHttp);
var should = chai.should();

var app;

describe('Miscalleneous tests', () => {

	before(function (done){
		fs.rmdirSync('dummy/uploads', {recursive:true});
		require('../server/app').init({
			input: ['dummy/dummy-folder/dummy-small.txt'],
			flags: {destination: 'dummy/uploads', list: ''}
		})
		.then((generatedApp) => {
			app = generatedApp;
			done();
		});	
	});

	it('it should return correct API response', (done) => {
		chai.request(app)
		.get('/download/list')
		.end((err, res) => {
			res.body.should.be.an('array');
			res.body.length.should.equal(1);
			res.body[0].should.have.property('name', 'dummy-small.txt');
			res.body[0].should.have.property('isFolder', false);
			res.body[0].should.have.property('size', fs.statSync('dummy/dummy-folder/dummy-small.txt').size);
			res.body[0].should.have.property('index', 0);
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
