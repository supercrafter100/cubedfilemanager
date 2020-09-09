# CubedFileManager

CubedFileManager is a tool made for auto uploading your files to the Cubedcraft playerservers. It is mainly made for skript and the default settings (no parameters) will make it ready for skript use.

## Installation

Make sure you have [nodeJS](https://nodejs.org/en/download/) installed. 

```bash
npm install cubedfilemanager -g
```

## Usage

To use the package. Open the command terminal, and type
```bash
cd <directory>
```
After doing this you should be in the folder where your scripts are located at / where you want to make them.

Next, go to the [Playerservers File manager](https://playerservers.com/dashboard/filemanager) and look for the cookie called PHPSESSID. Copy the content of it.

### Starting the program

To start the program, execute the following:

```bash
cfm . --session=<phpsessid here>
```

It will check if the token is valid, and install the required script if it doesnt exist already.
When finished it will show you the dashboard url.

When creating / saving / deleting a file, it will do the same on your file manager and send a message ingame when done.

## Reporting issues

You can report issues to me by sending me a dm in discord (Supercrafter100#6600). I am always open for suggestions for it.

## Changelog

version 1.0.4:

- Added that if you save a file and it doesn't exist, it auto creates it.