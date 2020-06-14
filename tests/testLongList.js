var chai = require('chai');
var chaiHttp = require('chai-http');
var fs = require('fs');
var path = require('path');

chai.use(chaiHttp);
var should = chai.should();

var upFileSize = fs.statSync('dummy/dummy-up.txt').size;
var downFileSize = fs.statSync('dummy/dummy-down.txt').size;

var app;

function downloadAllTest(done) {
	chai.request(app)
	.get('/download/all')
	.end((err, res) => {
		res.should.have.property('status',200);
		res.header.should.have.property('content-type', 'application/zip');
		res.header.should.have.property('content-disposition', 'attachment; filename="allFiles.zip"');
		res.header.should.have.property('transfer-encoding', 'chunked');
		done();
	});
}

function testValidDownload (done, index) {
	chai.request(app)
	.get('/download/single')
	.query({
		index: index
	})
	.end((err, res) => {
		res.should.have.property('status',200);
		res.header.should.have.property('content-length', downFileSize.toString());
		res.header.should.have.property('content-type', 'text/plain; charset=UTF-8');
		res.header.should.have.property('content-disposition', 'attachment; filename="dummy-down.txt"');
		done();
	});
}

function testInvalidDownload (done, index) {
	chai.request(app)
	.get('/download/single')
	.query({
		index: index
	})
	.end((err, res) => {
		res.should.have.property('status',400);
		done();
	});
}

describe('When sharing with repititions', () => {

	before(function (done){
		require('../server/app')({
			input: ['dummy/dummy-down.txt'],
			flags: {destination: 'dummy/uploads', list: 'dummy/dummy-list-long.txt'}
		})
		.then((generatedApp) => {
			app = generatedApp;
			done();
		});	
	});

	it('it should load homepage', (done) => {
		chai.request(app)
		.get('/')
		.end((err, res) => {
			res.should.have.property('status',200);
			done();
		});
	});
	
	it('it should download a zip with name allFiles.zip', downloadAllTest);
	
	it('it should download the file', (done) => {
		testValidDownload(done, '0');
	});
	
	it('it should download a zip with name dummy-folder.zip', (done) => {
		chai.request(app)
		.get('/download/single')
		.query({
			index: '1'
		})
		.end((err, res) => {
			res.should.have.property('status',200);
			res.header.should.have.property('content-type', 'application/zip');
			res.header.should.have.property('content-disposition', 'attachment; filename="dummy-folder.zip"');
			res.header.should.have.property('transfer-encoding', 'chunked');
			done();
		});
	});
	
	it('it should not download invalid file', (done) => {
		testInvalidDownload(done, '2');
	});

	it('it should upload a file', (done) => {
		chai.request(app)
		.post('/')
		.set('Content-Type', 'multipart/form-data')
		.attach('files[]', fs.readFileSync('dummy/dummy-up.txt'), 'dummy-up.txt')
		.end((err, res) => {
			res.should.have.property('status',200);
			res.body.should.be.an('array');
			res.body[0].should.have.property('size', upFileSize);
			res.body[0].should.have.property('filename', 'dummy-up.txt');
			res.body[0].should.have.property('path', path.join('dummy', 'uploads', 'dummy-up.txt'));
			res.body[0].should.have.property('destination', 'dummy/uploads');
			done();
		});
	});
	
	it('it should not accept empty upload', (done) => {
		chai.request(app)
		.post('/')
		.end((err, res) => {
			res.should.have.property('status',400);
			done();
		});
	});
	
	it('it should download uploaded file', (done) => {
		chai.request(app)
		.get('/download/single')
		.query({
			index: '2'
		})
		.end((err, res) => {
			res.should.have.property('status',200);
			res.header.should.have.property('content-length', upFileSize.toString());
			res.header.should.have.property('content-type', 'text/plain; charset=UTF-8');
			res.header.should.have.property('content-disposition', 'attachment; filename="dummy-up.txt"');
			done();
		});
	});
	
	it('it should not open any download other than shared file', (done) => {
		testInvalidDownload(done, '3');
	});
	
	it('it should not generate duplicate downloads', (done) => {
		chai.request(app)
		.post('/')
		.set('Content-Type', 'multipart/form-data')
		.attach('files[]', fs.readFileSync('dummy/dummy-up.txt'), 'dummy-up.txt')
		.attach('files[]', fs.readFileSync('dummy/dummy-up.txt'), 'dummy-up.txt')
		.attach('files[]', fs.readFileSync('dummy/dummy-up.txt'), 'dummy-up.txt')
		.attach('files[]', fs.readFileSync('dummy/dummy-up.txt'), 'dummy-up.txt')
		.attach('files[]', fs.readFileSync('dummy/dummy-up.txt'), 'dummy-up.txt')
		.attach('files[]', fs.readFileSync('dummy/dummy-up.txt'), 'dummy-up.txt')
		.attach('files[]', fs.readFileSync('dummy/dummy-up.txt'), 'dummy-up.txt')
		.attach('files[]', fs.readFileSync('dummy/dummy-up.txt'), 'dummy-up.txt')
		.attach('files[]', fs.readFileSync('dummy/dummy-up.txt'), 'dummy-up.txt')
		.end((err, res) => {
			testInvalidDownload(done, '3');
		});
	});
	
	it('it should download a zip with name allFiles.zip', downloadAllTest);
	
	after(function(done) {
		delete require.cache[require.resolve('../server/app')];
		done();
	});
	
});
