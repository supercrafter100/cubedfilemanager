# CubedFileManager

CubedFileManager is a tool made for auto uploading your files to the Cubedcraft playerservers. It is mainly made for skript and the default settings (no parameters) will make it ready for skript use.

## Installation

Make sure you have [nodeJS](https://nodejs.org/en/download/) installed. After that run the following command in a command terminal:

```bash
npm install cubedfilemanager -g
```

## Usage

To use the package. Open the command terminal, and type
```bash
cd <directory>
```
After doing this you should be in the folder where your scripts are located at / where you want to make them.

#### Starting without manually grabbing the cookie.

If you dont want to get the PHPSESSID yourself, you can start the system with 
```bash
cfm . 
```

This will ask your for your login details and what server you wish to work on.


#### Starting by grabbbing the cookie yourself.

If you want to get the token yourself, you may follow the steps below.

go to the [Playerservers File manager](https://playerservers.com/dashboard/filemanager) and look for the cookie called PHPSESSID. Copy the content of it. 


To start the program, execute the following:

```bash
cfm . --session=<phpsessid here>
```

It will check if the token is valid, and install the required script if it doesnt exist already.
When finished it will show you the dashboard url.

### What happens next?
When creating / saving / deleting a file, it will do the same on your file manager and send a message ingame when done.

## Reporting issues

You can report issues to me by sending me a dm in discord (Supercrafter100#6600). I am always open for suggestions for it.

## Changelog

version 2.0.1:

- Added a function to save your username and password. It will ask if you want to do this when you entered your credentials

<<<<<<< HEAD
=======
- If you want it to auto log you in, you can go to the place where this package is saved, and add a .env file containing the following: 

```bash
USER=yourusernametologinwith
PASS=yourpassword

#	optional
SERVER=yourserver
```
>>>>>>> c0704fa10a1a0062f72c5560cc6fd87af545e508

