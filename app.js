
// ------------------------------------------------
// BASIC SETUP
// ------------------------------------------------

let options = {
    Generate: generateTree,
    visuals: {
        treeColor: [110,59,32],
        leafColor: [0, 255, 0],
        leafAlpha: 0.2
    },
    rules: {
        // configurable values:
        distributionSum: 10,
        dist: [0.1, 0.5, 0.9, 1, 1],
        maxIteration: 10,
        maxHeight: 50,
        widthMult: 1,
        taperingScale: 0.16,
        leaves: true
    },
    timer: 0
}

/**
 * given an array of percentages (likelihoods) for numbers encoded as the indices,
 * this function returns each number with the given likelihood. 
 * @param {array} dist 
 */
function randWithDist(dist) {
    let r = Math.random();
    for (let i = 0; i < dist.length; i++) {
        if (r < dist[i]) {
            return i;
        }
    }
}

function generateTree() {
    // clear the old tree
    basePoint.remove(basePoint.children[0]);
    populateBranch(basePoint, 0, 0, 0, options.rules.widthMult)
}

// configurable values:
let DIST = [0, 1, 1, 1, 1, 2, 2, 2, 2, 3];
let MAX_ITERATION = 10;
let MAX_HEIGHT = 50;
let MIN_RADIUS = 0.1;
let TURN_ITER_LIMITER = 10;

// Create an empty scene
var scene = new THREE.Scene();

// Create a basic perspective camera
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.z = 4;
camera.position.y = 10;
camera.lookAt(new THREE.Vector3(0, 10, 0));



// Create a renderer with Antialiasing
var renderer = new THREE.WebGLRenderer({antialias:true});

var controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.update();

// Configure renderer clear color
renderer.setClearColor("lightblue");

// Configure renderer size
renderer.setSize( window.innerWidth, window.innerHeight );

// Append Renderer to DOM
document.body.appendChild( renderer.domElement );



let basePoint = new THREE.Group();
scene.add(basePoint);

// Ground
var geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
geometry.rotateX(-Math.PI/2);

var material = new THREE.MeshBasicMaterial( { color: "lightgreen" } );
var plane = new THREE.Mesh( geometry, material );
scene.add( plane );

let light = new THREE.DirectionalLight("white", 0.5);
scene.add(light);
light.position.set(1, 1, 0);
light.lookAt(new THREE.Vector3(0, 0, 0));



// Render Loop
var render = function () {
  requestAnimationFrame( render );

  // Render the scene
  renderer.render(scene, camera);
};

let leafGeometry = new THREE.Geometry();
leafGeometry.vertices = [new THREE.Vector3(0,0,0), new THREE.Vector3(1,1,0), new THREE.Vector3(-1,1,0)]; 
leafGeometry.faces = [new THREE.Face3(0,1,2)];

let leafMat = new THREE.MeshBasicMaterial({ color: "green", side: THREE.DoubleSide, opacity: 0.25, transparent: true });
var treeMat = new THREE.MeshBasicMaterial( { color: "brown" } );

function populateBranch(baseBranch, iteration, baseHeight, cumulativeHeight, bottomRadius) {

    if (iteration == options.rules.maxIteration) {
        return;
    }

    let num = randWithDist(options.rules.dist);//Math.floor(Math.random() * 10);
    num = iteration == 0 ? 1 : num;

    for (let i = 0; i < num; i++) {

        // length of the branch
        let length = Math.tan(Math.random()*Math.PI/2)**(1/3) + 1;

        // make sure we dont exceed MAX_HEIGHT.
        if (length + cumulativeHeight > MAX_HEIGHT) {
            length = MAX_HEIGHT - cumulativeHeight;
        }

        let x = cumulativeHeight+length;
        let topRadius = options.rules.widthMult*Math.exp(-options.rules.taperingScale*x);//10/(4*x + 7);

        let points = [
            new THREE.Vector2(0, 0),
            new THREE.Vector2(bottomRadius, 0),
            new THREE.Vector2(topRadius, length),
            new THREE.Vector2(0, length),
        ];

        var geometry = new THREE.LatheGeometry( points, 5 );
        var lathe = new THREE.Mesh( geometry, treeMat );

        lathe.position.y = baseHeight;
        
        let theta = Math.random()*Math.PI*2;
        let phi = iteration == 0 ? 0 : Math.random()*Math.PI/4;

        lathe.rotateY(theta);
        lathe.rotateX(phi);

        
        // add leaves to branch:

        // num of leaves depends on two factors:
        //  1- the branch length: the longer the branch, the more leaves it has
        //  2- the branch radius: the thinner the branch, the more leaves it has
        // since the radius varies from top to bottom, I'll only concern myself with the average of the two.

        let avgRad = (bottomRadius + topRadius)/2;

        let numLeaves = options.rules.leaves ? Math.floor(Math.random()*length/avgRad) : 0;
        for (let i = 0; i < numLeaves; i++) {
            let yPos = Math.random()*length;
            let leaf = new THREE.Mesh(leafGeometry, leafMat);
            lathe.add(leaf);
            leaf.position.set(0, yPos, 0);
            leaf.rotation.set(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2);
        }


        baseBranch.add(lathe)
        if (length + cumulativeHeight < options.rules.maxHeight) {
            if (options.timer != 0) {
                setTimeout(() =>  populateBranch(lathe, iteration + 1, length, cumulativeHeight + length, topRadius), options.timer);
            }
            else {
                populateBranch(lathe, iteration + 1, length, cumulativeHeight + length, topRadius);
            }
        }
    }
}

//GUI setup:



var gui = new dat.GUI();

var visuals = gui.addFolder('Visuals');
visuals.addColor(options.visuals, "treeColor").onChange(color => {
    let c = new THREE.Color( color[0]/255, color[1]/255, color[2]/255 );
    treeMat.color = c;

});
visuals.addColor(options.visuals, "leafColor").onChange(color => {
    let c = new THREE.Color( color[0]/255, color[1]/255, color[2]/255 );
    leafMat.color = c;

});
visuals.add(options.visuals, "leafAlpha").min(0).max(1).onChange(a => {
    leafMat.opacity = a;
});
visuals.open();

var rules = gui.addFolder('Rules');
rules.add(options.rules, "maxIteration");
rules.add(options.rules, "maxHeight");

rules.add(options.rules, "widthMult");
rules.add(options.rules, "taperingScale");
rules.add(options.rules, "leaves");


let distFolder = rules.addFolder('Branching Distribution');

let dist = [0.09, 0.39, 0.42, 0.11, 0.01];
let distSum = 1;

for (i in options.rules.dist) {
    // use index for js closure 
    let index = i;
    distFolder.add(dist, i).min(0).max(1).listen().onFinishChange(() => {
        distSum = 0;
        for (j in dist) {
            distSum += dist[j];
        }

        for (j in dist) {
            if (distSum != 0) {
                let p = dist[j]/distSum;
                options.rules.dist[j] = j == 0 ? p : p + options.rules.dist[j - 1];
            }
            else {
                options.rules.dist[j] = j*0.2 + 0.2;
            }
        }
        console.log(options.rules.dist);
    });

}
distFolder.open();
rules.open();

let generateFolder = gui.add(options, "timer").min(0).max(1000).step(5);
gui.add(options, 'Generate');

populateBranch(basePoint, 0, 0, 0, 1);

render();