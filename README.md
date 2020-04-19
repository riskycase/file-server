# File sharing server
A file server based on node.js that allows sharing on the same local network, 
and possibly over the internet if bridging is used

## Badges
[![Build Status](https://travis-ci.com/riskycase/file-server.svg?branch=master)](https://travis-ci.com/riskycase/file-server)
[![Depfu](https://badges.depfu.com/badges/5c7a82c495e09f6aeed06d0708f2c363/status.svg)](https://depfu.com)
[![Depfu](https://badges.depfu.com/badges/5c7a82c495e09f6aeed06d0708f2c363/overview.svg)](https://depfu.com/github/riskycase/file-server?project_id=11774)
[![Maintainability](https://api.codeclimate.com/v1/badges/eaa51b0988f9f1072e2d/maintainability)](https://codeclimate.com/github/riskycase/file-server/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/eaa51b0988f9f1072e2d/test_coverage)](https://codeclimate.com/github/riskycase/file-server/test_coverage)

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

## Usage
* Create a text file which has the paths of the files you want to host on the 
server, each path seperated by a newline
* Enter `npm start [-l path] [-d| upload_path]` into the terminal where path is
 the path to the above text file and upload_path is where the files will be 
 uploaded to (if not defined it will be the uploads folder in the app)
* Get the IP address of the current device (which is host) on the local network
(let us assume it to be `192.168.1.2`)
* On another device present on the same network, open the following link:
`(IP address):3000` (here `192.168.1.2:3000`)
* Download the files shared and/or upload any files you want to share to the 
host device
* Retrieve the files sent from the uploads folder

## To-do
* Add tests
