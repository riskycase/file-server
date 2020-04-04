# File sharing server
A file server based on node.js that allows sharing on the same local network, 
and possibly over the internet if bridging is used

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
* Create a text file which has the links to the files you want to host on the 
server
* Enter `npm start [path]` into the terminal where path is the path to the 
above text file
* Get the IP address of the current device (which is host) on the local network
(let us assume it to be `192.168.1.2`)
* On another device present on the same network, open the following link:
`(IP address):3000` (here `192.168.1.2:3000`)
* Download the files shared and/or upload any files you want to share to the 
host device
* Retrieve the files sent from the uploads folder

## To-do
* Have custom upload destination
* Serve different pages for mobile and desktop
