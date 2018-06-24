
// Server port and URL
var port = 3000;
var serverURL = 'http://localhost:'+port;

var clientPort = 4200;
var corsURL = 'http://localhost:'+clientPort;

// Express
const express = require('express');
var cors = require('cors')
var corsOptions = {
	origin: corsURL,
	optionsSuccessStatus: 200
}
const app = express();
app.use(cors(corsOptions));
app.use('/vid', express.static('vid'));
app.use('/frames', express.static('frames'));
app.use('/variations', express.static('variations'));

// Body parser (for POST requests)
/*
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
*/

app.use(express.json({limit: '50mb'}));
//app.use(express.urlencoded());

// Random number generator
const rn = require('random-number');

// FS extra
var fs = require('fs-extra');

// FS Copy File Sync
const copyFileSync = require('fs-copy-file-sync');

// FFMpeg and Fluent FFMpeg (video generation)
var ffmpeg = require('fluent-ffmpeg');
var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

// UUID (random file name generation)
const uuidv4 = require('uuid/v4');

// Number of video frames
var numOfFrames = 224;

// Start listening on port 3000
app.listen(port, () => {
    console.log('server ready')
});



/* ---------- ---------- ---------- ---------- ---------- ---------- ---------- */
/*	GET RANDOM FRAMES SECTION
/* ---------- ---------- ---------- ---------- ---------- ---------- ---------- */

// Function to get random unique indexes from an array
const getRandomIndexes = (numberOfIndexes, maxIndex) => {
	randomIndexes = [];
	for (var i = 1; i <= numberOfIndexes; i++) {
		var random;
		var wrong;
		do{
			wrong = false;
			var options = {
				min:  0,
				max:  maxIndex,
				integer: true
			}
			random = rn(options);
			// Check for already existing values
			for(var j in randomIndexes){
				if (random == randomIndexes[j]){
					wrong = true;
					break; // break for loop
				}
			}
		} while (wrong);
		randomIndexes.push(random);
	}
	return randomIndexes;
}

// Function to get an array containing all source frames
function getFrameArray(){
	return new Promise((resolve, reject) => {
		var framesArray = [];
		fs.readdir(__dirname + '/frames', (err, files)=> {
			if (err){
				console.log('can not read files: ' + err);
				reject(err);
			} else {
				for (var i in files) {
					var id = files[i].replace('.jpg','');
					var path = serverURL + '/frames' + '/' + files[i];
					if (files[i].startsWith('.')){
						continue;
					}
					framesArray.push({"id":id, "path": path});
				}
				resolve(framesArray);
			}
		});
	});
}

// FUNCTION TO GET AN ARRAY OF 3 RANDOM SOURCE FRAMES
const getRandomFrames = (req, res) => {

	getFrameArray().then((allFrames) => {
		var maxIndex = allFrames.length;
		var randomIndexes = getRandomIndexes(3, maxIndex);
        console.log(randomIndexes);
		var randomFrames = [];
		for(var i = 0; i < randomIndexes.length; i++){
			randomFrames.push(allFrames[randomIndexes[i]]);
		}
		console.log(randomFrames);
		res.json(randomFrames);

	}).catch((error) => {
		console.log("errore"+ error);
	});

}


/* ---------- ---------- ---------- ---------- ---------- ---------- ---------- */
/*	GENERATE VIDEO SECTION
/* ---------- ---------- ---------- ---------- ---------- ---------- ---------- */

const generateVideo = (req, res) => {

	// For each frame...
    for(let frame = 0; frame <= (numOfFrames-1); frame++) {

        let paddedId = ''+frame;
        while( paddedId.length < 3) {
            paddedId = '0'+paddedId;
        }

		// Get all variations from the corresponding folder
        let variationsFrameDir = __dirname +'/variations/frame'+ paddedId +'/';
        let folderFiles = [];

        fs.readdirSync(variationsFrameDir).forEach(file => {
            if ( !file.startsWith('.') ) {
                folderFiles.push(file);
            }
        });

		// Choose one at random and copy it to the "selected-variations" folder
        var randFile = folderFiles[Math.floor( Math.random() * folderFiles.length )];
        copyFileSync(variationsFrameDir + randFile, __dirname +'/selected-variations/frame'+ paddedId +'.jpg')
    }

	// Generate video from the "selected-variations"
    var command = ffmpeg();
    command
        .addInput('./selected-variations/frame%03d.jpg')
        .inputFPS(8)
        .output('./vid/video.mp4')
        .outputFPS(8)
        .input('./mp3/music.mp3')
        .run();

    res.send();
    
}



/* ---------- ---------- ---------- ---------- ---------- ---------- ---------- */
/*	SAVE VARIATION SECTION
/* ---------- ---------- ---------- ---------- ---------- ---------- ---------- */

const saveVariation = (req,res) => {
    var idFrame = req.body.frame; // ID of the source frame
	var img = req.body.image; // Base 64 encoded variation

    var fileName = uuidv4() + '.jpg'; // random file name
    var filePath = __dirname + '/variations/'+ idFrame +'/'+ fileName;
	console.log('Filename: '+fileName);

    var data = img.replace(/^data:image\/\w+;base64,/, "");
	var buf = new Buffer(data, 'base64');
	fs.writeFile(filePath, buf, function(err){
		if (err) {
			console.log('saveVariation\'s writeFile error');
			throw err;
		}
		res.send(serverURL + '/variations/'+ idFrame +'/'+ fileName);
    });
}



/* ---------- ---------- ---------- ---------- ---------- ---------- ---------- */
/*	ROUTES SECTION
/* ---------- ---------- ---------- ---------- ---------- ---------- ---------- */
app.get('/get-random-frames', getRandomFrames);
app.get('/generate-video', generateVideo);
app.post('/save-variation', saveVariation);


/* ---------- ---------- ---------- ---------- ---------- ---------- ---------- */
/*	UTILITIES SECTION
/* ---------- ---------- ---------- ---------- ---------- ---------- ---------- */

/*
const createFakeVariations = (req,res) => {
    for(let i = 0; i <= 223; i++){

        let paddedId = ''+i;
        while( paddedId.length < 3) {
            paddedId = '0'+paddedId;
        }

		let srcFile = __dirname +'/frames/frame'+ paddedId +'.jpg';

		let variationFolder = __dirname +'/variations/frame'+ paddedId;
		if (! fs.existsSync(variationFolder) ) {
			fs.mkdirSync(variationFolder);
		}

        let destFile = variationFolder + '/frame' + paddedId + '.jpg';
        copyFileSync(srcFile, destFile);
    }
    res.send();
}
app.get('/create-fake-variations', createFakeVariations);
*/