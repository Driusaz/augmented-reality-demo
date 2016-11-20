var THREE = require('three');
//var THREE = require('../bower_components/threex.webar/examples/vendor/three.js/build/three.js');
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

//var SVD = require('../bower_components/threex.webar/vendor/js-aruco/svd.js');
//var SVD = require('../bower_components/threex.webar/vendor/js-aruco/posit1-patched.js');
//var SVD = require('../bower_components/threex.webar/vendor/js-aruco/cv.js');

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

// LIGHTS       
				var ambient = new THREE.AmbientLight( 0x444444 );
				scene.add( ambient );
				var light = new THREE.SpotLight( 0xffffff, 1, 0, Math.PI / 2 );
				light.position.set( 0, 1500, 1000 );
				light.target.position.set( 0, 0, 0 );
				light.castShadow = true;

				scene.add( light );

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

var mixer = new THREE.AnimationMixer( scene );
var morphs = [];

// add a object to the scene
(function () {
//    var material = new THREE.SpriteMaterial({
//        map: THREE.ImageUtils.loadTexture('images/awesome.png'),
//    });
//    var geometry = new THREE.BoxGeometry(1, 1, 1)
//    var object3d = new THREE.Sprite(material);
        
        var loader = new THREE.JSONLoader();
        loader.load("model/flamingo.js", function (geometry) {
            var material = new THREE.MeshLambertMaterial({
                color: 0xffaa55,
                morphTargets: true,
                vertexColors: THREE.FaceColors
            });
            material.color.offsetHSL(0, Math.random() * 0.5 - 0.25, Math.random() * 0.5 - 0.25);

            var mesh = new THREE.Mesh( geometry, material );
            mesh.speed = 550;
            var duration = 1;
            var clip = geometry.animations[ 0 ];
            mixer.clipAction( clip, mesh ).
                    setDuration( duration ).
                    // to shift the playback out of phase:
                    startAt( - duration * Math.random() ).
                    play();
            
            mesh.position.set(0, 0, 1);
            mesh.rotation.y = Math.PI / 2;
            mesh.rotation.x = Math.PI / 2;
            mesh.scale.set(0.01, 0.01, 0.01);

            markerObject3D.add(mesh);
            morphs.push( mesh );
        });
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

var clock = new THREE.Clock();

// render the scene
onRenderFcts.push(function () {
    renderStats.begin();
    if (webglRenderEnabled === true) {
        
        var delta = clock.getDelta();
				mixer.update( delta );
				for ( var i = 0; i < morphs.length; i ++ ) {
					morph = morphs[ i ];
					morph.position.x += 0;					
				}
        
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