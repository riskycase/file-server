# ![Logo](./icon.png) Broadcast 'em
A file server based on node.js that allows sharing files over HTTP on the same
 local network, and possibly over the internet if bridging is used

## Badges
[![Build Status](https://travis-ci.com/riskycase/file-server.svg?branch=master)](https://travis-ci.com/riskycase/file-server)
[![Depfu](https://badges.depfu.com/badges/676150a60ab4fce2f90451fc5422a308/status.svg)](https://depfu.com)
[![Depfu](https://badges.depfu.com/badges/676150a60ab4fce2f90451fc5422a308/overview.svg)](https://depfu.com/github/riskycase/file-server?project_id=11774)
[![Maintainability](https://api.codeclimate.com/v1/badges/1211097ff94e3af18c35/maintainability)](https://codeclimate.com/github/riskycase/file-server/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/1211097ff94e3af18c35/test_coverage)](https://codeclimate.com/github/riskycase/file-server/test_coverage)

## Setup

* Make sure node.js is installed along with npm
* Open a command line tool (Command Prompt or Powershell for Windows and bash
shell in Linux)
* Clone the repo `git clone https://github.com/riskycase/file-server.git` or 
your own fork
* Navigate to the folder `cd file-server`
* Install all dependencies `npm install` or optionally do a global install 
`npm install -g`
* Start the server using the inbuilt script `npm start`
* Open a browser and go to `localhost:3000` to make sure everything is working
* The application is managed using pm2 so any changes need to be issued using 
pm2 commands. Therefore for stopping the server we use `pm2 kill`

## Usage

### Options

```
	Usage
	  $ npm start [options] [files]
	  files is an array of paths to files you want to share

	Options
	  --destination, -d	PATH	Save uploaded files to folder specified in path (defaults to uploads folder in app directory)
	  --list, -l		PATH	Read files to share from the list given in path
	  --port, -p		PORT	Start server on specified port (default 3000)

	Examples
	  $ npm start 
```

* Start the server from the usage options given
* Get the IP address of the current device (which is host) on the local network
(let us assume it to be `192.168.1.2`)
* On another device present on the same network, open the following link:
`(IP address):(port)` (here `192.168.1.2:3000`)
* Download the files shared and/or upload any files you want to share to the 
host device
* Retrieve the files sent from the uploads folder
