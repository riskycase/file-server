var chai = require('chai');
var chaiHttp = require('chai-http');
var fs = require('fs');
var path = require('path');

process.env.NODE_ENV = 'test';

chai.use(chaiHttp);
var should = chai.should();

var upFileSize = fs.statSync('dummy/dummy-up.txt').size;
var downFileSize = fs.statSync('dummy/dummy-down.txt').size;

var app;

function uploadTest(done) {
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
}

function downloadAllTest(done) {
	chai.request(app)
	.get('/download')
	.end((err, res) => {
		res.should.have.property('status',200);
		res.header.should.have.property('content-type', 'application/zip');
		res.header.should.have.property('content-disposition', 'attachment; filename="allFiles.zip"');
		res.header.should.have.property('transfer-encoding', 'chunked');
		done();
	});
}

function testUploadedDownload (done, index) {
	chai.request(app)
	.post('/download')
	.send({
		file: index
	})
	.end((err, res) => {
		res.should.have.property('status',200);
		res.header.should.have.property('content-length', upFileSize.toString());
		res.header.should.have.property('content-type', 'text/plain; charset=UTF-8');
		res.header.should.have.property('content-disposition', 'attachment; filename="dummy-up.txt"');
		done();
	});
}

function testValidDownload (done, index) {
	chai.request(app)
	.post('/download')
	.send({
		file: index
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
	.post('/download')
	.send({
		file: index
	})
	.end((err, res) => {
		res.should.have.property('status',400);
		done();
	});
}

function testEmptyDownload(done) {
	chai.request(app)
	.post('/')
	.end((err, res) => {
		res.should.have.property('status',400);
		done();
	});
}

function testHomepage (done) {
	chai.request(app)
	.get('/')
	.end((err, res) => {
		res.should.have.property('status',200);
		done();
	});
}

describe('When not sharing anything', () => {

	before(function (done){
		require('../app')({
			input: [],
			flags: {destination: 'dummy/uploads', list: ''}
		})
		.then((generatedApp) => {
			app = generatedApp;
			done();
		});	
	});

	it('it should load homepage', testHomepage);
	
	it('it should not open any download', (done) => {
		chai.request(app)
		.get('/download')
		.end((err, res) => {
			res.should.have.property('status',403);
			done();
		});
	});
	
	it('it should not open any download with data specified', (done) => {
		chai.request(app)
		.post('/download')
		.send({
			file: '0'
		})
		.end((err, res) => {
			res.should.have.property('status',403);
			done();
		});
	});

	it('it should upload a file', uploadTest);
	
	it('it should not accept empty upload', testEmptyDownload);
	
	it('it should download uploaded file', (done) => {
		testUploadedDownload(done, '0');
	});
	
	it('it should not open any download other than shared file', (done) => {
		testInvalidDownload(done, '1');
	});
	
	it('it should download a zip with name allFiles.zip', downloadAllTest);
	
});

describe('When sharing a single file', () => {

	before(function (done){
		require('../app')({
			input: ['dummy/dummy-down.txt'],
			flags: {destination: 'dummy/uploads', list: ''}
		})
		.then((generatedApp) => {
			app = generatedApp;
			done();
		});	
	});

	it('it should load homepage', testHomepage);
	
	it('it should download a zip with name allFiles.zip', downloadAllTest);
	
	it('it should download the file', (done) => {
		testValidDownload(done, '0');
	});
	
	it('it should not download invalid file', (done) => {
		testInvalidDownload(done, '1');
	});
		
	it('it should upload a file', uploadTest);
	
	it('it should not accept empty upload', testEmptyDownload);
	
	it('it should download uploaded file', (done) => {
		testUploadedDownload(done, '1');
	});
	
	it('it should not open any download other than shared file', (done) => {
		testInvalidDownload(done, '2');
	});
	
	it('it should download a zip with name allFiles.zip', downloadAllTest);
	
});

describe('When sharing from a list', () => {

	before(function (done){
		require('../app')({
			input: [],
			flags: {destination: 'dummy/uploads', list: 'dummy/dummy-list.txt'}
		})
		.then((generatedApp) => {
			app = generatedApp;
			done();
		});	
	});

	it('it should load homepage', testHomepage);
	
	it('it should download a zip with name allFiles.zip', downloadAllTest);
	
	it('it should download the file', (done) => {
		testValidDownload(done, '0');
	});
	
	it('it should download a zip with name dummy-folder.zip', (done) => {
		chai.request(app)
		.post('/download')
		.send({
			file : '1'
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
		
	it('it should upload a file', uploadTest);
	
	it('it should not accept empty upload', testEmptyDownload);
	
	it('it should download uploaded file', (done) => {
		testUploadedDownload(done, '2');
	});
	
	it('it should not open any download other than shared file', (done) => {
		testInvalidDownload(done, '3');;
	});
	
	it('it should download a zip with name allFiles.zip', downloadAllTest);
	
});
