let camera, scene, renderer, raycaster, mouse;
let spheres = [];
let comets = [];
let focusDistance = 1000; // Initial distance for focus
let targetSphere = null; // The sphere to focus on after clicking
let zoomSpeed = 10; // Control the zoom speed
let model; // Variable to store the loaded model

init();
animate();

function init() {
    // Create Scene and Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);

    // Add Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add Directional Light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Raycaster and Mouse
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Load the GLB model
    const loader = new THREE.GLTFLoader();
    loader.load('cyberpunk_robot.glb', function(gltf) {
        model = gltf.scene;
        model.scale.set(5, 5, 5); // Adjust the scale of the model
        model.position.set(0, 0, 0); // Position the model at the sphere's center

        // Create Spheres and distribute them along the Z-axis
        let geometry = new THREE.SphereGeometry(25, 32, 32);
        let material = new THREE.MeshNormalMaterial({
            transparent: true,
            opacity: 0.9  // Adjust this value between 0 (fully transparent) and 1 (fully opaque)
        });

        for (let i = 0; i < 500; i++) {
            let sphere = new THREE.Mesh(geometry, material);
            sphere.position.x = Math.random() * 1600 - 800;
            sphere.position.y = Math.random() * 1600 - 800;
            sphere.position.z = Math.random() * 2000 - 1000; // Z-axis spread
            sphere.userData.originalScale = sphere.scale.clone(); // Store original scale for animation
            sphere.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            ); // Random velocity

            // Add the model to 10 random spheres
            if (i < 10) {
                const modelClone = model.clone();
                sphere.add(modelClone);
            }

            scene.add(sphere);
            spheres.push(sphere);
        }
    }, undefined, function (error) {
        console.error('An error occurred while loading the model:', error);
    });

    // Create comets (lines between random spheres)
    for (let i = 0; i < 10; i++) { // Adjust number of comets
        let startSphere = spheres[Math.floor(Math.random() * spheres.length)];
        let endSphere = spheres[Math.floor(Math.random() * spheres.length)];
        let cometMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        let cometGeometry = new THREE.BufferGeometry().setFromPoints([startSphere.position, endSphere.position]);
        let comet = new THREE.Line(cometGeometry, cometMaterial);
        comets.push({
            line: comet,
            start: startSphere.position,
            end: endSphere.position,
            progress: 0,
            speed: 0.005 + Math.random() * 0.01 // Random speed for each comet
        });
        scene.add(comet);
    }

    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('scroll', onScroll, false);
    document.addEventListener('click', onClick, false); // Add click event listener
    document.addEventListener('mousemove', onMouseMove, false); // Add mouse move event listener
    window.addEventListener('wheel', onWheel, false); // Add zoom function
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onScroll() {
    let scrollAmount = window.scrollY; // Use window.scrollY to get the current scroll position
    let focusIndex = Math.floor(scrollAmount / 200); // Determine which sphere to focus on
    focusIndex = Math.min(focusIndex, spheres.length - 1); // Ensure index is within bounds
    
    focusDistance = 1000 - scrollAmount * 2; // Adjust the Z-axis of the camera
    camera.position.z = focusDistance;

    // If no targetSphere is set (from a click), focus on the selected sphere
    if (!targetSphere) {
        camera.lookAt(spheres[focusIndex].position);
    }
}

function onClick(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the ray
    const intersects = raycaster.intersectObjects(spheres);

    if (intersects.length > 0) {
        // Set the clicked sphere as the target
        targetSphere = intersects[0].object;
    }
}

function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the ray
    const intersects = raycaster.intersectObjects(spheres);

    if (intersects.length > 0) {
        // If the mouse is over a sphere, scale it up for a hover effect
        intersects[0].object.scale.set(1.5, 1.5, 1.5);
    }

    // Reset the scale of all other spheres
    spheres.forEach(sphere => {
        if (!intersects.length || intersects[0].object !== sphere) {
            sphere.scale.copy(sphere.userData.originalScale);
        }
    });
}

function onWheel(event) {
    camera.position.z += event.deltaY * 0.05 * zoomSpeed; // Adjust zoom speed as needed
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    spheres.forEach(sphere => {
        // Apply velocity to move spheres
        sphere.position.add(sphere.userData.velocity);

        // Rotate spheres for added effect
        sphere.rotation.x += 0.01;
        sphere.rotation.y += 0.01;

        // Bounce spheres off the bounds
        if (sphere.position.x > 800 || sphere.position.x < -800) sphere.userData.velocity.x *= -1;
        if (sphere.position.y > 800 || sphere.position.y < -800) sphere.userData.velocity.y *= -1;
        if (sphere.position.z > 1000 || sphere.position.z < -1000) sphere.userData.velocity.z *= -1;
    });

    // Animate comets (lines)
    comets.forEach(comet => {
        comet.progress += comet.speed;
        if (comet.progress > 1) {
            comet.progress = 0; // Reset the comet when it reaches the end
        }

        // Update the comet's position
        let currentPos = new THREE.Vector3().lerpVectors(comet.start, comet.end, comet.progress);
        comet.line.geometry.setFromPoints([comet.start, currentPos]);
        comet.line.geometry.attributes.position.needsUpdate = true;
    });

    // Smoothly move camera towards the targetSphere
    if (targetSphere) {
        let targetPosition = targetSphere.position;
        camera.position.lerp(new THREE.Vector3(targetPosition.x, targetPosition.y, camera.position.z), 0.02); // Slower movement
        camera.lookAt(targetSphere.position);

        // Optionally, stop focusing after the camera gets close enough
        if (camera.position.distanceTo(targetPosition) < 5) {
            targetSphere = null; // Clear the target once focused
        }
    }

    renderer.render(scene, camera);
}
