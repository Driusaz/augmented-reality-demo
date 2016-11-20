var THREE = require('../bower_components/threex.webar/examples/vendor/three.js/build/three.js');
var Stats = require('../bower_components/threex.webar/examples/vendor/three.js/examples/js/libs/stats.min.js');

var JsArucoMarker = require('../bower_components/threex.webar/threex.jsarucomarker.js').JsArucoMarker;
var ImageGrabbing = require('../bower_components/threex.webar/threex.imagegrabbing.js').ImageGrabbing;
var WebcamGrabbing = require('../bower_components/threex.webar/threex.webcamgrabbing.js').WebcamGrabbing;
var VideoGrabbing = require('../bower_components/threex.webar/threex.videograbbing.js').VideoGrabbing;



var THREEx = {
    JsArucoMarker: JsArucoMarker,
    ImageGrabbing: ImageGrabbing,
    WebcamGrabbing: WebcamGrabbing,
    VideoGrabbing: VideoGrabbing
};

//var THREEx.ImageGrabbing = require('../bower_components/threex.webar/threex.imagegrabbing.js');
//var THREEx.JsArucoMarker = require('../bower_components/threex.webar/threex.jsarucomarker.js');
//var THREEx.JsArucoMarker = require('../bower_components/threex.webar/threex.jsarucomarker.js');
//    <!-- include js-aruco -->
//    <script src='../vendor/js-aruco/svd.js'></script>
//    <script src='../vendor/js-aruco/posit1-patched.js'></script>
//    <script src='../vendor/js-aruco/cv.js'></script>
//    <script src='../vendor/js-aruco/aruco.js'></script>

var detectMarkersEnabled = true;
var markerToObject3DEnabled = true;
var webglRenderEnabled = true;

//////////////////////////////////////////////////////////////////////////////////
//		Test if the browser support WebGL and getUserMedia
//////////////////////////////////////////////////////////////////////////////////
(function () {
    // TODO backport those 2 in Detector.js
    var hasGetUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia) ? true : false
    var hasMediaStreamTrackSources = MediaStreamTrack.getSources ? true : false
    var hasWebGL = (function () {
        try {
            var canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    })()

    if (hasWebGL === false) {
        alert('your browser doesn\'t support navigator.getUserMedia()')
    }
    if (hasMediaStreamTrackSources === false) {
        alert('your browser doesn\'t support MediaStreamTrack.getSources()')
    }
    if (hasGetUserMedia === false) {
        alert('your browser doesn\'t support navigator.getUserMedia()')
    }
})();

//////////////////////////////////////////////////////////////////////////////////
//		init Stats for detectMarkers
//////////////////////////////////////////////////////////////////////////////////
var detectMarkersStats = new Stats();
detectMarkersStats.setMode(1);
document.body.appendChild(detectMarkersStats.domElement);
detectMarkersStats.domElement.style.position = 'absolute';
detectMarkersStats.domElement.style.bottom = '0px';
detectMarkersStats.domElement.style.right = '0px';

var renderStats = new Stats();
renderStats.setMode(0);
document.body.appendChild(renderStats.domElement);
renderStats.domElement.style.position = 'absolute';
renderStats.domElement.style.bottom = '0px';
renderStats.domElement.style.left = '0px';

//////////////////////////////////////////////////////////////////////////////////
//		Init
//////////////////////////////////////////////////////////////////////////////////
var renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// array of functions for the rendering loop
var onRenderFcts = [];

// init scene and camera
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.z = 2;

//////////////////////////////////////////////////////////////////////////////////
//		create a markerObject3D
//////////////////////////////////////////////////////////////////////////////////
var markerObject3D = new THREE.Object3D();
scene.add(markerObject3D);

(function () {
    var geometry = new THREE.PlaneGeometry(1, 1, 10, 10)
    var material = new THREE.MeshBasicMaterial({
        wireframe: true
    })
    var mesh = new THREE.Mesh(geometry, material);
    markerObject3D.add(mesh);

    var mesh = new THREE.AxisHelper
    markerObject3D.add(mesh);
})();

// add a awesome logo to the scene
(function () {
    var material = new THREE.SpriteMaterial({
        map: THREE.ImageUtils.loadTexture('images/awesome.png'),
    });
    var geometry = new THREE.BoxGeometry(1, 1, 1)
    var object3d = new THREE.Sprite(material);
    object3d.scale.set(2, 2, 1);
    markerObject3D.add(object3d)
})();

//////////////////////////////////////////////////////////////////////////////////
//		render the whole thing on the page
//////////////////////////////////////////////////////////////////////////////////

// handle window resize
window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
}, false);


// render the scene
onRenderFcts.push(function () {
    renderStats.begin();
    if (webglRenderEnabled === true) {
        renderer.render(scene, camera);
    }
    renderStats.end();
});

// run the rendering loop
var previousTime = performance.now();
requestAnimationFrame(function animate(now) {

    requestAnimationFrame(animate);

    onRenderFcts.forEach(function (onRenderFct) {
        onRenderFct(now, now - previousTime)
    })

    previousTime = now;
});

//////////////////////////////////////////////////////////////////////////////////
//		Do the Augmented Reality part
//////////////////////////////////////////////////////////////////////////////////

// init the marker recognition
var jsArucoMarker = new THREEx.JsArucoMarker();

// if no specific image source is specified, take the webcam by default
if (location.hash === '') location.hash = '#webcam';

// init the image source grabbing
if (location.hash === '#video') {
    var videoGrabbing = new THREEx.VideoGrabbing();
    jsArucoMarker.videoScaleDown = 2;
} else if (location.hash === '#webcam') {
    var videoGrabbing = new THREEx.WebcamGrabbing();
    jsArucoMarker.videoScaleDown = 2;
} else if (location.hash === '#image') {
    var videoGrabbing = new THREEx.ImageGrabbing();
    jsArucoMarker.videoScaleDown = 10;
} else console.assert(false);

// attach the videoGrabbing.domElement to the body
document.body.appendChild(videoGrabbing.domElement);

//////////////////////////////////////////////////////////////////////////////////
//		Process video source to find markers
//////////////////////////////////////////////////////////////////////////////////
// set the markerObject3D as visible
markerObject3D.visible = false;
// process the image source with the marker recognition
onRenderFcts.push(function () {
    if (detectMarkersEnabled === false) return;

    var domElement = videoGrabbing.domElement;
    detectMarkersStats.begin();
    var markers = jsArucoMarker.detectMarkers(domElement);
    detectMarkersStats.end();

    if (markerToObject3DEnabled === false) return;
    markerObject3D.visible = false;

    // see if this.markerId has been found
    markers.forEach(function (marker) {
        // if( marker.id !== 265 )	return

        jsArucoMarker.markerToObject3D(marker, markerObject3D);

        markerObject3D.visible = true;
    })
});