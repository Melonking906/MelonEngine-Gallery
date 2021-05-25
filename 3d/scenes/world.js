// This is a MelonEngine gallery made by Daniel Murray - https://melonking.net

import * as THREE from 'https://melonking.net/scripts/libs/three/r128/build/three.module.js';
import * as MELON from '../MelonEngine.js';

var loadingPlot;

MELON.startErUp( init, [ startWorld, setupDone ], loop );

function init()
{
	loadingPlot = document.getElementById( 'plot-loading' );

	MELON.me.three.scene.background = new THREE.Color( 0xffffff );
	MELON.me.three.scene.fog = new THREE.Fog( 0xffffff, 0, 40 );

	MELON.preLoadModel( 'gallery', 'gallery', false );
	
	MELON.preLoadTexture( 'picture1.jpg', 'one', new THREE.MeshBasicMaterial() );
	MELON.preLoadTexture( 'picture2.jpg', 'two', new THREE.MeshBasicMaterial() );
	MELON.preLoadTexture( 'picture3.jpg', 'three', new THREE.MeshBasicMaterial() );
	MELON.preLoadTexture( 'picture4.jpg', 'four', new THREE.MeshBasicMaterial() );
	MELON.preLoadTexture( 'picture5.jpg', 'five', new THREE.MeshBasicMaterial() );
	MELON.preLoadTexture( 'picture6.jpg', 'six', new THREE.MeshBasicMaterial() );
}

function startWorld()
{
	MELON.me.three.camera.rotateY( 1.641593 );
	MELON.me.three.camera.rotateX( 1.641593 );
	MELON.setPlayerPosition( new THREE.Vector3( 0, 1, 2 ) );

	var gallery = MELON.spawnObject( 'gallery', 'Gallery', 0.2 );
	gallery.setScale( 0.11 );
	
	var picture1 = MELON.getObject('Art1');
	picture1.material = MELON.getLoadedTexture('one');
	processPicture( picture1 );
	
	var picture2 = MELON.getObject('Art2');
	picture2.material = MELON.getLoadedTexture('two');
	processPicture( picture2 );
	
	var picture3 = MELON.getObject('Art3');
	picture3.material = MELON.getLoadedTexture('three');
	processPicture( picture3 );
	
	var picture4 = MELON.getObject('Art4');
	picture4.material = MELON.getLoadedTexture('four');
	processPicture( picture4 );
	
	var picture5 = MELON.getObject('Art5');
	picture5.material = MELON.getLoadedTexture('five');
	processPicture( picture5 );
	
	var picture6 = MELON.getObject('Art6');
	picture6.material = MELON.getLoadedTexture('six');
	processPicture( picture6 );
}

function setupDone()
{	
	loadingPlot.style.visibility = "hidden";
	
	MELON.printToConsole( 'Welcome to this gallery!' );
	MELON.printToConsole( 'PC: Hold left mouse to Look - Hold right mouse to Move' );
	MELON.printToConsole( 'Mobile: 1 finger to Look - 2 fingers to Move' );
}

function loop()
{

}

function processPicture( picObject )
{
	let imageWidth = picObject.material.map.image.width;
	let imageHeight = picObject.material.map.image.height;
	
	if( imageWidth > imageHeight ) // Image is landscape
	{
		let ratio = imageWidth - imageHeight;
		let factor = 1 - ratio / imageWidth;
		picObject.melon.setScales( 1, 1, factor );
		picObject.translateZ( -(1 - factor) * 7 ); // Lower painting so its easy to see
	}
	else // Image is square or portrait
	{
		let ratio = imageHeight - imageWidth;
		let factor = 1 - ratio / imageHeight;
		picObject.melon.setScales( factor, 1, 1 );
	}
}