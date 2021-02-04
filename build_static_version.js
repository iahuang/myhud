/* Build a static version of the webapp, mainly for demo purposes on Github Pages */

const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const jsdom = require('jsdom');
const {JSDOM} = jsdom;

function copyAndModifyFile(src, dest, transformer) {
    let contents = fs.readFileSync(src, 'utf-8');
    if (transformer) {
        contents = transformer(contents);
    }
    
    fs.writeFileSync(dest, contents);
}

function copyFileSync( source, target ) {

    var targetFile = target;

    // If target is a directory, a new file with the same name will be created
    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}
function copyFolderRecursiveSync( source, target ) {
    var files = [];

    // Check if folder needs to be created or integrated
    var targetFolder = path.join( target, path.basename( source ) );
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }

    // Copy
    if ( fs.lstatSync( source ).isDirectory() ) {
        files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            var curSource = path.join( source, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolderRecursiveSync( curSource, targetFolder );
            } else {
                copyFileSync( curSource, targetFolder );
            }
        } );
    }
}

console.log("Building static version...");

if (!fs.existsSync("build/client")) {
    throw new Error("Project must be built first!");
}

// copy static assets

if (fs.existsSync("_docs")) {
    fs.rmdirSync("_docs", {recursive: true});
}

fs.mkdirSync("_docs");
copyFolderRecursiveSync("public", "_docs");

fse.moveSync("_docs/public", "docs", {overwrite: true});

fs.mkdirSync("docs/client");
copyAndModifyFile("build/client/bundle.js", "docs/client/bundle.js");

fs.rmdirSync("_docs", {recursive: true});

copyAndModifyFile("docs/index.html", "docs/index.html", (html)=>{
    let jsdom =  new JSDOM(html);
    let window = jsdom.window;

    let newScript = window.document.createElement('script');
    newScript.appendChild(window.document.createTextNode("window.MYHUD_STATIC = true;"))
    window.document.head.appendChild(newScript);
    return jsdom.serialize();
})