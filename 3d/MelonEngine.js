"use strict";
import * as THREE from 'https://melonking.net/scripts/libs/three/r128/build/three.module.js';
import { OrbitControls } from 'https://melonking.net/scripts/libs/three/r128/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://melonking.net/scripts/libs/three/r128/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'https://melonking.net/scripts/libs/three/r128/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://melonking.net/scripts/libs/three/r128/examples/jsm/postprocessing/RenderPass.js';

//MelonEngine 0.4.1 - by Daniel Murray - https://melonking.net

//Statics
export const CENTER = new THREE.Vector3( 0, 0, 0 );
export const UP = new THREE.Vector3( 0, 1, 0 );
export const DOWN = new THREE.Vector3( 0, -1, 0 );
export const FORWARD = new THREE.Vector3( 0, 0, -1 );
export const BACK = new THREE.Vector3( 0, 0, 1 );
export const LEFT = new THREE.Vector3( 1, 0, 0 );
export const RIGHT = new THREE.Vector3( -1, 0, 0 );

//VarBox
export let me = {};

//HTML
me.html = {};
me.html.canvas = document.getElementById( 'plot-canvas' );
me.html.console = document.getElementById( 'plot-console' );

//THREE Stuff
me.three = {};
me.three.loaders = {};
me.three.loaders.gltf = new GLTFLoader();
me.three.loaders.audio = new THREE.AudioLoader();
me.three.loaders.texture = new THREE.TextureLoader();
me.three.clock = new THREE.Clock();
me.three.raycaster = new THREE.Raycaster();
me.three.audioListener = new THREE.AudioListener();
me.three.renderer = getStandardRenderer();
me.three.camera = getStandardCamera();
me.three.controls = getStandardControls();
me.three.scene = new THREE.Scene();
me.three.composer = new EffectComposer( me.three.renderer );
me.three.animationMixers = [];

//Loading System
me.loading = {};
me.loading.isLoaded = false;
me.loading.expectedCount = 0;
me.loading.actualCount = 0;
me.loading.initStage = function() {};
me.loading.loopStage = function() {};
me.loading.launch = {};
me.loading.launch.stages = [];
me.loading.launch.count = 0;

//Preload
me.models = [];
me.textures = [];

//Console
me.console = {};
me.console.rows = 3; //Number of rows to print
me.console.history = [];

//System Info
me.info = {};
me.info.gameTime = 0;
me.info.screenWidth = window.innerWidth;
me.info.screenHeight = window.innerHeight;

me.info.mouse = {};
me.info.mouse.position = new THREE.Vector2();
me.info.mouse.leftButton = {};
me.info.mouse.leftButton.isDown = false;
me.info.mouse.leftButton.downTime = 0;
me.info.mouse.rightButton = {};
me.info.mouse.rightButton.isDown = false;
me.info.mouse.rightButton.downTime = 0;

//Player
me.player = {};
me.player.height = 1;
me.player.viewRange = 0.1;
me.player.isOnGround = false;

me.player.actions = {};
me.player.actions.defaultRange = 10;
me.player.actions.objects = [];

//Ground System
me.ground = {};
me.ground.defaultDistance = 15;
me.ground.objects = [];

export function startErUp( extraInit, launchStages, extraLoop )
{
    me.loading.initStage = extraInit;
    me.loading.launch.stages = launchStages;
    me.loading.loopStage = extraLoop;
    init();
    loop();
}

//Basic setup and loading
function init()
{
    me.three.camera.add( me.three.audioListener );

    me.three.scene.background = new THREE.Color( 0x060606 );
    me.three.scene.fog = new THREE.Fog( 0xfffefc, 0, 1000 );

    //Events
    document.addEventListener( 'pointerdown', onDocumentMouseDown );
    document.addEventListener( 'pointerup', onDocumentMouseUp );
    window.addEventListener( 'resize', onWindowResize );

    composerSetup();

    me.loading.initStage.call();
}

//Will call each launch stage, one per loop
function launch()
{
    if ( me.loading.isLoaded ) { return; }
    if ( me.loading.expectedCount !== me.loading.actualCount ) { return; }
    if ( me.loading.launch.count + 1 > me.loading.launch.stages.length )
    {
        me.loading.isLoaded = true;
        return;
    }
    me.loading.launch.stages[ me.loading.launch.count ].call();
    me.loading.launch.count++;
}

//Game loop
function loop()
{
    me.info.gameTime++;
    launch();

    //Camera logic
    //groundMapPlayer();
    me.three.controls.update(); //NOT SURE WHY BUT FOR SOME REASON THIS NEED STO BE HERE
    updateCameraTarget();
    me.three.controls.update();

    updateMouseLogic();

    //Animation support
    let delta = me.three.clock.getDelta();
    let mixerCount = me.three.animationMixers.length;
    for ( let m = 0; m < mixerCount; m++ )
    {
        me.three.animationMixers[ m ].update( delta );
    }

    //Custom loop code
    if ( me.loading.isLoaded ) { me.loading.loopStage.call(); }

    //Standard Loop Logic
    me.three.controls.update();
    requestAnimationFrame( loop );
    me.three.composer.render();
}

//+++ Setup helpers +++

function composerSetup()
{
    me.three.composer.addPass( new RenderPass( me.three.scene, me.three.camera ) );
}

export function getStandardCamera()
{
    let camera = new THREE.PerspectiveCamera( 70, me.html.canvas.clientWidth / me.html.canvas.clientHeight, 0.1, 1000 );
    camera.position.y = 1000;
    camera.fov = 60;
    return camera;
}

export function getStandardRenderer()
{
    let canvas = me.html.canvas;
    let renderer = new THREE.WebGLRenderer( { canvas, antialias: false } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( canvas.clientWidth, canvas.clientHeight );
    renderer.physicallyCorrectLights = false;
    return renderer;
}

export function getStandardControls()
{
    let controls = new OrbitControls( me.three.camera, document.body );
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.enableKeys = false;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 0;
    controls.maxDistance = 1;
    controls.maxPolarAngle = Math.PI / 1.1;
    controls.panSpeed = 40;
    controls.keyPanSpeed = 10000;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.8;
    return controls;
}

//+++ Loaders +++

//++ Helpers
function findPreload( name, preloads )
{
    let count = preloads.length;
    for ( let preload = 0; preload < count; preload++ )
    {
        if ( preloads[ preload ].name === name )
        {
            return preloads[ preload ];
        }
    }
    return undefined;
}

//++ GLTF Model Loading
export function preLoadModel( filename, name, kidSkip = true )
{
    me.loading.expectedCount++;
    me.three.loaders.gltf.load( '3d/models/' + filename + '.gltf', ( gltf ) =>
    {
        let data = {};
        data.name = name;
        if ( kidSkip ) { data.model = gltf.scene.children[ 0 ]; } //kidskip skips the first child for models using inner groups
        else { data.model = gltf.scene; }
        data.animations = gltf.animations;
        me.models.push( data );
        me.loading.actualCount++;
    } );
}

//Spawns a model in a melon object
export function spawnObject( modelName, name, animSpeed = 1 )
{
    return spawnCustomObject( modelName, new MelonSuperObject( name ), animSpeed );
}

//Spawns a model in a custom Object3D extending object
export function spawnCustomObject( modelName, customObject, animSpeed = 1 )
{
    let data = findPreload( modelName, me.models );
    if ( data === undefined ) { return undefined; }

    let nameSave = customObject.name; //Fix for copy overwriting names
    customObject.copy( data.model, true );
    customObject.name = nameSave;

    MelonSuperObject.regenMelonObjectExtenders( customObject, true );
    processGroundObjects( customObject.children );
    applyAnimations( customObject, data.animations, animSpeed );

    me.three.scene.add( customObject );

    return customObject;
}

function applyAnimations( model, animations, speed = 1 )
{
    if ( animations.length > 0 )
    {
        me.three.animationMixers.push( new THREE.AnimationMixer( model ) );
        let action = me.three.animationMixers[ me.three.animationMixers.length - 1 ].clipAction( animations[ 0 ] );
        action.timeScale = speed;
        action.play();
    }
}

function processGroundObjects( objects )
{
    let objectCount = objects.length;
    for ( let i = 0; i < objectCount; i++ )
    {
        let processingObject = objects[ i ];

        if ( processingObject.name.toUpperCase().includes( 'GROUND_' ) )
        {
            me.ground.objects.push( processingObject );
        }

        processGroundObjects( processingObject.children );
    }
}

//++ Texture Loading
export function preLoadTexture( filename, name, material )
{
    me.loading.expectedCount++;
    me.three.loaders.texture.load( '3d/sprites/' + filename, function( texture )
    {
        material.map = texture;
        material.name = name;
        me.textures.push( material );
        me.loading.actualCount++;
    } );
}

export function preLoadSprite( filename, name )
{
    preLoadTexture( filename, name, new THREE.SpriteMaterial() );
}

export function getLoadedTexture( name )
{
    return findPreload( name, me.textures );
}

//++ Audio Loading
export function loadGlobalAudio( name, isLoop = true, volume = 1 )
{
    let audioClip = new THREE.Audio( me.three.audioListener );

    me.three.loaders.audio.load( 'audio/' + name, function( buffer )
    {
        audioClip.setBuffer( buffer );
        audioClip.setLoop( isLoop );
        audioClip.setVolume( volume );
    } );

    return audioClip;
}

export function loadLocalAudio( name, distance = 20, isLoop = true, volume = 0.5 )
{
    let audioClip = new THREE.PositionalAudio( me.three.audioListener );
    me.three.loaders.audio.load( 'audio/' + name, function( buffer )
    {
        audioClip.setBuffer( buffer );
        audioClip.setRefDistance( distance );
        audioClip.setLoop( isLoop );
        audioClip.setVolume( volume );
    } );
    return audioClip;
}

//+++ Runtime functions +++

export function getPlayerPosition()
{
    return me.three.camera.getWorldPosition( new THREE.Vector3() );
}

export function getPlayerRotation()
{
    return me.three.camera.getWorldQuaternion( new THREE.Quaternion() );
}

export function getPlayerTarget()
{
    return me.three.controls.target.clone();
}

export function setPlayerPosition( posVector3 )
{
    me.three.camera.position.copy( posVector3 );
    me.three.controls.target.copy( posVector3 );
    return me.three.controls.target;
}

export function getObject( name )
{
    return me.three.scene.getObjectByName( name );
}

export function removeObject( name )
{
    me.three.scene.remove( me.three.scene.getObjectByName( name ) );
}

export function getMouseDownFrames( mouseType )
{
    switch ( mouseType )
    {
        case 0:
            return me.info.mouse.leftButton.downTime;
        case 2:
            return me.info.mouse.rightButton.downTime;
        default:
            return -1;
    }
}

//+++ Main system functionality +++

//Window resizing logic
function onWindowResize()
{
    me.info.screenWidth = window.innerWidth;
    me.info.screenHeight = window.innerHeight;
    me.three.camera.aspect = me.info.screenWidth / me.info.screenHeight;
    me.three.camera.updateProjectionMatrix();
    me.three.renderer.setSize( me.info.screenWidth, me.info.screenHeight );
    me.three.composer.setSize( me.info.screenWidth, me.info.screenHeight );
}

//Updates the target of the camera THIS SUCKS REDO LATER
export function updateCameraTarget()
{
    me.three.raycaster.setFromCamera( new THREE.Vector2(), me.three.camera );
    let inFrontOfCamera = new THREE.Vector3();
    me.three.raycaster.ray.at( me.player.viewRange, inFrontOfCamera );
    me.three.controls.target = inFrontOfCamera;
}

//+++ Ground System +++
function groundMapPlayer()
{
    me.three.raycaster.set( me.three.camera.position, DOWN );
    let intersects = me.three.raycaster.intersectObjects( me.ground.objects, true );

    if ( intersects.length < 1 ) //Player is in mid air
    {
        me.player.isOnGround = false;
        return;
    }

    if ( intersects[ 0 ].distance > me.ground.defaultDistance ) { return; } //Too far away

    let newGroundPoint = new THREE.Vector3( intersects[ 0 ].point.x, intersects[ 0 ].point.y, intersects[ 0 ].point.z );
    newGroundPoint.y += me.player.height;

    me.three.camera.position.y = newGroundPoint.y;
    me.three.controls.target.y = newGroundPoint.y;
    me.player.isOnGround = true;
}

export function groundMapObject( thingToMap )
{
    let rayPos = thingToMap.getWorldPosition( new THREE.Vector3() );

    me.three.raycaster.set( rayPos, DOWN );
    let intersects = me.three.raycaster.intersectObjects( me.ground.objects, true );

    if ( intersects.length < 1 ) { return false; }

    thingToMap.position.y -= intersects[ 0 ].distance - ( thingToMap.melon.height / 2 );
    return true;
}

export function addGroundObject( newGround )
{
    me.ground.objects.push( newGround );
}

export function isOverGround( pointVector3 )
{
    me.three.raycaster.set( pointVector3, DOWN );
    let intersects = me.three.raycaster.intersectObjects( me.ground.objects, true );
    return intersects > 0;
}

//+++ Mouse Logic +++
function onDocumentMouseDown( event )
{
    me.info.mouse.position.x = ( event.clientX / me.three.renderer.domElement.clientWidth ) * 2 - 1;
    me.info.mouse.position.y = -( event.clientY / me.three.renderer.domElement.clientHeight ) * 2 + 1;

    //Left Click Events
    if ( event.button === 0 )
    {
        me.info.mouse.leftButton.isDown = true;
        processAction();
    }

    //Right Click Events
    if ( event.button === 2 )
    {
        me.info.mouse.rightButton.isDown = true;
    }
}

function onDocumentMouseUp( event )
{
    //Left Click Events
    if ( event.button === 0 )
    {
        me.info.mouse.leftButton.isDown = false;
    }

    //Right Click Events
    if ( event.button === 2 )
    {
        me.info.mouse.rightButton.isDown = false;
    }
}

function updateMouseLogic()
{
    if ( me.info.mouse.leftButton.isDown ) { me.info.mouse.leftButton.downTime++ }
    else { me.info.mouse.leftButton.downTime = 0; }

    if ( me.info.mouse.rightButton.isDown ) { me.info.mouse.rightButton.downTime++ }
    else { me.info.mouse.rightButton.downTime = 0; }
}

//+++ Action System +++

function processAction()
{
    if ( me.player.actions.objects.length < 1 ) { return; } //No actions, return

    me.three.raycaster.setFromCamera( me.info.mouse.position, me.three.camera );

    let intersects = me.three.raycaster.intersectObjects( me.player.actions.objects, true );
    if ( intersects.length < 1 ) { return; } //Nothing clicked, return

    doFirstParentAction( intersects[ 0 ].object, intersects[ 0 ].distance );
}

function doFirstParentAction( object, distance )
{
    if ( object === undefined ) { return; }
    if ( object.melon === undefined ) { return; }
    let success = object.melon.doAction( distance );
    if ( !success ) { doFirstParentAction( object.parent, distance ); }
}

export function registerAction( object, action, interactDistance = me.player.actions.defaultRange, oneTime = false )
{
    if ( object === undefined ) { return; }
    object.melon.action = new MelonAction( action, interactDistance, oneTime );
    me.player.actions.objects.push( object );
}

//+++ Standard Interactions +++

export function printToConsole( text )
{
    me.console.history.push( text );
    let lastIndex = me.console.history.length - me.console.rows;
    let consoleText = '';

    for ( let i = 0; i < me.console.rows; i++ )
    {
        let entry = me.console.history[ lastIndex + i ];
        if ( entry === undefined || entry === '' )
        {
            continue;
        }
        consoleText += '<br/>' + entry;
    }
    me.html.console.innerHTML = consoleText;
}

//+++ Game Helper Functions +++
export function getRandomInt( min, max )
{
    return Math.floor( ( Math.random() * max ) + min );
}

export function getRandomFloat( min, max )
{
    return ( Math.random() * max ) + min;
}

//https://karthikkaranth.me/blog/generating-random-points-in-a-sphere/
export function getRandomPositionInRange( center, range )
{
    let u = Math.random();
    let v = Math.random();
    let theta = u * 2.0 * Math.PI;
    let phi = Math.acos( 2.0 * v - 1.0 );
    let r = Math.cbrt( Math.random() * range );
    let sinTheta = Math.sin( theta );
    let cosTheta = Math.cos( theta );
    let sinPhi = Math.sin( phi );
    let cosPhi = Math.cos( phi );
    let x = r * sinPhi * cosTheta;
    let y = r * sinPhi * sinTheta;
    let z = r * cosPhi;
    return new THREE.Vector3( x + center.x, y + center.y, z + center.z );
}

//+++ Classes +++

// A top level wrapper for all spawned objects
export class MelonSuperObject extends THREE.Object3D
{
    constructor( name )
    {
        super();
        this.name = name;
    }

    static regenMelonObjectExtenders( object, isRecursive = true )
    {
        object.melon = new MelonObjectExtender( object );
        if ( !isRecursive ) { return; }
        for ( let o = 0; o < object.children.length; o++ )
        {
            MelonSuperObject.regenMelonObjectExtenders( object.children[ o ] );
        }
    }

    setPosition( newPos )
    {
        this.position.copy( newPos );
    }

    setScale( scale )
    {
        if ( this.melon === undefined ) { MelonSuperObject.regenMelonObjectExtenders( this, false ); }
        this.melon.setScale( scale );
    }
}

// Data and helper class that is appended to all THREE.Object3Ds
export class MelonObjectExtender
{
    constructor( object )
    {
        this._ref = object;
        this._action = undefined;
        this._height = 0;
        this.updateMeta();
    }

    get action()
    {
        return this._action;
    }

    set action( value )
    {
        this._action = value;
    }

    //Meta system
    get height()
    {
        return this._height;
    }

    //Action system
    doAction( distance )
    {
        if ( this._action === undefined ) { return false; }
        return this.action.doMe( distance );
    }

    updateMeta()
    {
        let box = new THREE.Box3().setFromObject( this._ref ); //Make a bounding box
        this._height = box.max.y - box.min.y;
    }

    //Helper methods
    setScale( scale )
    {
        this._ref.scale.set( scale, scale, scale );
        this.updateMeta();
    }
    
    setScales( x, y, z )
    {
        this._ref.scale.set( x, y, z );
        this.updateMeta();
    }
}

//Interactive item data
export class MelonAction
{
    constructor( actionFunction, interactDistance, isOneTime )
    {
        this._actionFunction = actionFunction;
        this._interactDistance = interactDistance;
        this._isOneTime = isOneTime;
        this._callCount = 0;
    }

    get interactDistance()
    {
        return this._interactDistance;
    }

    get callCount()
    {
        return this._callCount;
    }

    doMe( distance )
    {
        if ( distance > this.interactDistance ) { return false; }
        if ( this._isOneTime && this._callCount > 0 ) { return false; }

        this._actionFunction.call();
        this._callCount++;
        return true;
    }
}