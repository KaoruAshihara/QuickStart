// sopaOpen.js version 1.0.1
// JavaScript source code for Panoramic sound with full-spherical image
// Created by Kaoru Ashihara
/*
The MIT License (MIT)

Copyright (c) 2019 AIST

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var sopaOpen = (function () {

    var sopa;       // SOPA instance
    var isInit = true;
    var isDevInit = true;
    var isQuery = false;
    var isOK = false;
    var isCube = false;
    var isMobile = false;
    var isFox = false;
    var isOpr = false;
    var isPlayed = false;
    var isIphone = false;
    var isIpad = false;
    var isMoving = false;
    var isRight = false;
    var isUp = false;
    var isDown = false;
    var isWait = true;
    var isSS = false;
    var isStill = false;
    var isLoop = false;
    var isToplay = false;
    var isLoaded = false;

    var element;
    var backElem;
    var width, height;
    var marginX;
    var scrY;
    var clHeight;
    var ratio;
    var ratioY;
    var rect;
    var motionRate = 0.00002;

    var text2;
    var ua = navigator.userAgent.toLowerCase();
    var scene;
    var video;
    var videoImage;
    var texture;
    var camera;
    var geometry;
    var material;
    var cube;
    var mPosition = { x: 0, y: 0 };
    var touchPosit = { x: 0, y: 0 };
    var moved = { x: 0, y: 0 };
    var gcontrols;
    var renderer;
    var cubeCount = 0;
    var urlStr;
    var hrtfStr;
    var phaseStr;
    var imgStr;
    var toggle = 0;     // Directionality factor 0; Omni, 1; Cardioid, 2; Cardioid^2
    var horizontalAngle = 0;
    var verticalAngle = 0;
    var play = 0;
    var numImages;
    var imgNum;
    var numSopaFiles;
    var prev;
    var former = 0;
    var total = 0;
    var sopaNum;
    var sampleRate;
    var offsetGamma = 0;
    var offsetBeta = 0;
    var yaw = 0;
    const dblPI = Math.PI * 2;
    const rightAngle = Math.PI / 2;

    function sopaOpen() {
        if (!Detector.webgl) {
            Detector.addGetWebGLMessage();
            alert("Sorry, your graphic card does not seem to support WebGL.");
            return;
        }
        if (!XMLHttpRequest) {
            alert("Sorry, your browser does not seem to support XMLHttpRequest.\nPanoramic sound cannot be loaded.");
            return;
        }
        //        try {
        //	        renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer = webglAvailable() ? new THREE.WebGLRenderer({ alpha: true }) : null;
        if (renderer) {
            scene = new THREE.Scene();
        }
        else {
            alert("Sorry, your browser does not seem to support WebGL.\nPanoramic video is not available.\nOnly the panoramic sound may be played.");
            return;
        }
        /*        }
                catch (e) {
                    alert("Sorry, your browser does not seem to support WebGL.")
                    return;
                }   */
        if (ua.indexOf('android') > -1) {
            isMobile = true;
            if (ua.indexOf('firefox') > -1) {
                isFox = true;
                //	            alert("FireFox");
            }
            else if (ua.indexOf('opera') > -1 || ua.indexOf('opr') > -1) {
                isOpr = true;
                //	            alert("Opera");
            }
            else {
                isFox = true;
                //	            alert("Something");
            }
        }
        else if (ua.indexOf('iphone') > -1 || ua.indexOf('ipod') > -1) {
            isMobile = true;
            isIphone = true;
            //	        alert("Mobile");
        }
        else if (ua.indexOf('ipad') > -1) {
            isMobile = true;
            isIpad = true;
        }
        //	    else
        //	        alert("Desktop");
        if (window.location.search) {
            var n = window.location.search.substring(1, window.location.search.length);
            var vars = n.split('&');
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split('=');
                if (decodeURIComponent(pair[0]) == "sopa") {
                    document.form0.elements["sopa"].value = decodeURIComponent(pair[1]);
                }
                else if (decodeURIComponent(pair[0]) == "image") {
                    document.form0.elements["image"].value = decodeURIComponent(pair[1]);
                }
                else if (decodeURIComponent(pair[0]) == "numFiles") {
                    document.form0.elements["numFiles"].value = decodeURIComponent(pair[1]);
                }
                else if (decodeURIComponent(pair[0]) == "numStart") {
                    document.form0.elements["numStart"].value = decodeURIComponent(pair[1]);
                }
            }
            isQuery = true;
        }
        this.init();
    }

    function webglAvailable() {
        try {
            var canvas = document.createElement("canvas");
            return !!
                (window.WebGLRenderingContext &&
                (canvas.getContext("webgl") ||
                    canvas.getContext("experimental-webgl")));
        } catch (e) {
            return false;
        }
    }

    sopaOpen.prototype.init = function () {
        var that = this;
        var cardioidElem;
        var tmpStr, myStr;

        if (isQuery) {
            element = document.form0.elements.sopa;
            if (element && element.value.length > 0) {
                urlStr = element.value;
            }
            else {
                alert("SOPA file is not specified!");
                return;
            }
        }
        else {
            var ar = window.location.href.split(".");
            if (ar[ar.length - 1] == "html") {
                element = document.getElementById("myUrl");
                if (element == null) {
                    alert("Location of SOPA file is not specified!");
                    return;
                }
                urlStr = element.innerHTML;
            }
            else if (ar[ar.length - 1] == "sopa")
                urlStr = window.location.href;
        }
        myStr = urlStr;

        if (isQuery) {
            element = document.form0.elements.numFiles;
            if (element && element.value.length > 0) {
                numSopaFiles = element.value;
            }
            else {
                numSopaFiles = 1;
            }
        }
        if (!isQuery || numSopaFiles < 2) {
            element = document.getElementById("numFiles");
            if (element == null)
                numSopaFiles = 1;
            else
                numSopaFiles = element.innerHTML;
        }

        if (isQuery) {
            element = document.form0.elements.numStart;
            if (element && element.value.length > 0) {
                sopaNum = element.value;
            }
            else {
                sopaNum = 0;
            }
        }
        if (!isQuery || sopaNum < 1) {
            element = document.getElementById("numStart");
            if (element == null)
                sopaNum = 0;
            else
                sopaNum = parseInt(element.innerHTML);
        }

        element = document.getElementById("loop");
        if (element == null || parseInt(element.innerHTML) == 1)
            isLoop = false;
        else
            isLoop = true;

        element = document.getElementById("cube");
        if (element == null)
            isCube = false;
        else if (parseInt(element.innerHTML) > 0)
            isCube = true;
        else
            isCube = false;
        var hrtf_element = document.getElementById("hrtfUrl");
        hrtfStr = hrtf_element.innerHTML;
        var phase_element = document.getElementById("phaseUrl");
        phaseStr = phase_element.innerHTML;

        if (numSopaFiles > 1) {
            tmpStr = urlStr.substring(0, urlStr.lastIndexOf('.'));
            if (sopaNum < 10) {
                myStr = tmpStr + "0" + sopaNum + ".sopa";
            }
            else
                myStr = tmpStr + sopaNum + ".sopa";
        }
        sopa = new Sopa(myStr);    // Constructor of a SOPA instance
        sopa.setCardioid(toggle, 0, 0);
        sopa.loadDatabase(hrtfStr, phaseStr);    // Load HRTF databases
        sopa.loadSopaData();                    // Load SOPA data

        if (numSopaFiles > 1) {
            sopaNum++;
            if (sopaNum >= numSopaFiles)
                sopaNum = 0;
        }

        if (isQuery) {
            element = document.form0.elements.image;
            if (element && element.value.length > 0) {
                imgStr = element.value;
            }
            else {
                tmpStr = urlStr.substring(0, urlStr.lastIndexOf('.'));
                imgStr = tmpStr + ".mp4";
            }
        }
        else {
            element = document.getElementById("imgUrl");
            if (element && element.innerHTML.length > 0) {
                imgStr = element.innerHTML;
            }
        }
        var sub = imgStr.substring(imgStr.lastIndexOf('.'), imgStr.length);
        tmpStr = imgStr;
        if (sub == ".jpg") {
            isSS = true;
            isWait = false;
            var num_element = document.getElementById("numImage");
            if (num_element == null) {
                numImages = 1;
                imgNum = 0;
            }
            else {
                numImages = num_element.innerHTML;
                element = document.getElementById("jpgStart");
                if (element == null)
                    imgNum = 0;
                else
                    imgNum = parseInt(element.innerHTML);
                if (imgNum > 0) {
                    if (imgNum < 10)
                        tmpStr = imgStr.slice(0, imgStr.length - 4) + "000" + imgNum + ".jpg";
                    else if (imgNum < 100)
                        tmpStr = imgStr.slice(0, imgStr.length - 4) + "00" + imgNum + ".jpg";
                    else if (imgNum < 1000)
                        tmpStr = imgStr.slice(0, imgStr.length - 4) + "0" + imgNum + ".jpg";
                }
            }
            if (numImages > 1) {
                var int_element = document.getElementById("interval");
                if (int_element == null) {
                    alert("Slide interval is not defined!");
                    sampleInterval = 22050;
                }
                else
                    sampleInterval = int_element.innerHTML;
            }
            else
                isStill = true;
        }

        width = window.innerWidth;
        height = window.innerHeight;

        document.body.style.overflow = "hidden"
        document.body.style.position = 'fixed';

        //mesh
        this.getImage(tmpStr);
        cube = new THREE.Mesh(geometry, material);
        cubeCount++;
        cube.position.set(0, 0, 0);
        cube.rotation.order = "YXZ";
        scene.add(cube);

        ratio = 0.96;
        if (isMobile)
            ratioY = 0.85;
        else
            ratioY = 0.8;
        marginX = width * (1 - ratio) / 2;

        //camera
        camera = new THREE.PerspectiveCamera(75, (width * ratio) / (height * ratioY), 1, 1000);
        camera.position.set(0, 0, 0.1);
        //	    camera.lookAt(new THREE.Vector3(0, 0, -1));
        camera.lookAt({ x: 0, y: 0, z: -1 });
        camera.rotation.order = "YXZ";

        renderer.setSize(width * ratio, height * ratioY);
        renderer.setClearColor({ color: 0x000000 });
        renderer.domElement.style.position = 'relative';
        renderer.domElement.style.bottom = 0 + 'px';
        renderer.domElement.style.left = marginX + 'px';
        document.getElementById('stage').appendChild(renderer.domElement);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.render(scene, camera);

        element = document.getElementById('stage');
        rect = element.getBoundingClientRect();
        clHeight = rect.bottom - rect.top;
        scrY = window.pageYOffset;

        text2 = document.createElement('div');
        text2.style.position = 'relative';
        //text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
        text2.style.width = width;
        text2.style.height = height / 8;
        text2.style.color = "orange";
        text2.style.fontSize = 32 + 'px';
        if (isMobile) {
            if (isIphone && window.orientation != 0 && window.orientation != 180)
                text2.style.bottom = height / 3 + 20 + 'px';
            else
                text2.style.bottom = height / 4 + 'px';
        }
        else {
            text2.style.bottom = height / 4 + 'px';
        }
        text2.innerHTML =
            "Loading data. Wait for a moment.<BR>Stereo headphones are necessary";
        text2.style.left = 0 + 'px';
        text2.style.textAlign = 'center';
        text2.style.filter = 'dropshadow(color=#ffff0000, offx=10, offy=10, positive=true)';
        //        document.body.appendChild(text2);
        document.getElementById('stage').appendChild(text2);

        cardioidElem = document.createElement('button');
        cardioidElem.innerHTML = "OMNIDIRECTIONAL";
        cardioidElem.style.background = "rgba(255,240,192,0.75)";
        cardioidElem.style.color = "#009900";
        cardioidElem.style.fontSize = 24 + 'px';
        cardioidElem.style.position = 'relative';

        if (isIpad)
            cardioidElem.style.top = -(height / 4 - 50) + 'px';
        else if (isIphone) {
            if (window.orientation == 0 || window.orientation == 180)
                cardioidElem.style.top = -(height / 4 - 60) + 'px';
            else
                cardioidElem.style.top = -(height / 2 - 40) + 'px';
        }
        else if (isMobile)
            cardioidElem.style.top = -(height / 3 - 60) + 'px';
        else
            cardioidElem.style.top = -(height / 10) + 'px';
        cardioidElem.setAttribute('align', 'center');
        cardioidElem.onclick = function () {
            toggle++;
            if (toggle > 2)
                toggle = 0;
            sopa.setCardioid(toggle, 0, 0);
            if (toggle == 0)
                cardioidElem.innerHTML = "OMNIDIRECTIONAL";
            else if (toggle == 1)
                cardioidElem.innerHTML = "CARDIOID IS ON";
            else
            cardioidElem.innerHTML = "CARDIOID<sup>2</sup> IS ON";
        };
        document.getElementById('stage').appendChild(cardioidElem);

        //control

        if (isMobile) {
            if (window.DeviceOrientationEvent) {
                window.addEventListener("deviceorientation", that.orient, true);
            }
            else {
                alert("deviceorientation is not supported");
            }
            gcontrols = new THREE.DeviceOrientationControls(camera, renderer.domElement);
            gcontrols.connect();
        }
        if (!isMobile) {
            window.addEventListener('mousemove', function (e) {
                var myOffset = rect.top - scrY;
                if (e.clientX < marginX || e.clientX > width - marginX) {
                    mPosition.x = mPosition.y = 0;
                    return;
                }
                if (e.clientY < myOffset || e.clientY > rect.bottom - scrY) {
                    mPosition.x = mPosition.y = 0;
                    return;
                }
                if (e.clientX >= width / 3 && e.clientX < width * 2 / 3)
                    mPosition.x = 0;
                else if (e.clientX < width / 3)
                    mPosition.x = e.clientX - width / 3;
                else
                    mPosition.x = e.clientX - width * 2 / 3;

                if (e.clientY >= myOffset + clHeight / 3 && e.clientY < myOffset + clHeight * 2 / 3)
                    mPosition.y = 0;
                else if (e.clientY < myOffset + clHeight / 3)
                    mPosition.y = e.clientY - (myOffset + clHeight / 3);
                else
                    mPosition.y = e.clientY - (myOffset + clHeight * 2 / 3);
            }, false);
        }

        this.render();
        this.initVariables();

        renderer.domElement.addEventListener('click', function () {
            if (isMoving) {
                isMoving = false;
                //	            return;
            }
            if (play == 4) {
                sopa.Play();
                isPlayed = true;
                if (!isSS && !isIphone && !isIpad) {
                    video.pause();
                }
                if (numSopaFiles > 1 && isLoop) {
                    text2.innerHTML = urlStr + " was played. <BR>Good bye";
                    play++;
                }
                else {
                    if (isMobile)
                        text2.innerHTML = urlStr + " was played. <BR>Tap back button to close this window.";
                    else
                        text2.innerHTML = urlStr + " was played. <BR>Thank you.";
                    play = 2;
                }
            }
            else if (play > 4) {
                text2.innerHTML = "Please reload this page";
            }
            else if (play == 2) {
                if (isPlayed)
                    play++;
                if (!isSS)
                    video.currentTime = 0;
                if (isMobile)
                    text2.innerHTML = "Tap to start<BR>Please use stereo headphones";
                else
                    text2.innerHTML = "Click to start<BR>Please use stereo headphones";
            }
            else if (play == 3) {
                total = 0;
                if (isMobile)
                    text2.innerHTML =
                        "Tap to stop reproduction<BR>Rotate device to change panning";
                else
                    text2.innerHTML =
                        "Click to stop reproduction<BR>Move the mouse pointer to change panning";
                //           console.log("Playing" + play);
                if (!isSS)
                    video.currentTime = 0;
                if (numSopaFiles > 1) {
                    sopa.setLastLoop(false);
                }
                else
                    sopa.setLastLoop(true);

                if (isIphone || isIpad) {
                    sopa.Play();    // Start reproduction
                }
                isToplay = true;
                if (!isIphone && !isIpad && !isSS)
                    video.play();
            }
            else if (play == -1) {
                if (isOpr) {
                    video.play();
                    text2.innerHTML = "Preparing data, wait for a while<BR>Use stereo headphones";
                }
            }
        }, false);

        if (isMobile) {
            window.addEventListener('touchmove', function (e) {
                e.preventDefault();
            }, false);
            renderer.domElement.addEventListener('touchstart', function (e) {
                var touchobj = e.changedTouches[0];
                touchPosit.y = parseInt(touchobj.clientY);
                touchPosit.x = parseInt(touchobj.clientX);
                //	                e.preventDefault();
            }, false);
            renderer.domElement.addEventListener('touchmove', function (e) {
                var touchobj = e.changedTouches[0];
                moved.y = parseInt(touchobj.clientY) - touchPosit.y;
                moved.x = parseInt(touchobj.clientX) - touchPosit.x;
                touchPosit.y = parseInt(touchobj.clientY);
                touchPosit.x = parseInt(touchobj.clientX);
                if (window.orientation == -90)
                    moved.x *= -1;
            }, false);
        }
    };

    sopaOpen.prototype.orient = function (event) {
        if (!event.alpha && !event.gamma && !event.beta)
            alert("deviceorientation not available");
        else if (isDevInit) {
            offsetGamma = event.gamma * Math.PI / 180;
            offsetBeta = event.beta * Math.PI / 180;
            isDevInit = false;
        }
        window.removeEventListener("deviceorientation", this.orient, true);
    };

    sopaOpen.prototype.initVariables = function () {
        var nAngl;
        var nTilt, nPan;

        horizontalAngle = 0;
        verticalAngle = 0;
        play = 0;

    };

    sopaOpen.prototype.getImage = function (str) {
        if (isSS) {
            if (cubeCount == 0) {
                if (!isCube)
                    material = new THREE.MeshBasicMaterial({ color: 0xffffff, overdraw: true });      // for sphere
                else
                    material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide, overdraw: true });      // for cube
            }
            isLoaded = false;
            var loader = new THREE.TextureLoader();
            loader.crossOrigin = '*';
            loader.load(str, function (texture) {
                // The actual texture is returned in the event.content
                material.map = texture;
                material.needsUpdate = true;
            },
	        function (xhr) {
	            if (xhr.loaded == xhr.total)
	                isLoaded = true;
	        },
            function (xhr) {
                alert("TextureLoader not supported!")
            });

            if (cubeCount == 0) {
                if (!isCube) {
                    geometry = new THREE.SphereGeometry(10, 12, 12);
                    geometry.scale(-1, 1, 1);
                }
                else {
                    var front = [new THREE.Vector2(0, .5), new THREE.Vector2(.25, .5), new THREE.Vector2(.25, 1), new THREE.Vector2(0, 1)];
                    var right = [new THREE.Vector2(.25, .5), new THREE.Vector2(.5, .5), new THREE.Vector2(.5, 1), new THREE.Vector2(.25, 1)];
                    var back = [new THREE.Vector2(.5, .5), new THREE.Vector2(.75, .5), new THREE.Vector2(.75, 1), new THREE.Vector2(.5, 1)];
                    var left = [new THREE.Vector2(.75, .5), new THREE.Vector2(1, .5), new THREE.Vector2(1, 1), new THREE.Vector2(.75, 1)];
                    var bottom = [new THREE.Vector2(0, 0), new THREE.Vector2(.25, 0), new THREE.Vector2(.25, .5), new THREE.Vector2(0, .5)];
                    var top = [new THREE.Vector2(.25, 0), new THREE.Vector2(.5, 0), new THREE.Vector2(.5, .5), new THREE.Vector2(.25, .5)];

                    geometry = new THREE.CubeGeometry(10, 10, 10);
                    geometry.faceVertexUvs[0] = [];
                    geometry.faceVertexUvs[0][0] = [left[2], left[1], left[3]];
                    geometry.faceVertexUvs[0][1] = [left[1], left[0], left[3]];

                    geometry.faceVertexUvs[0][2] = [right[2], right[1], right[3]];
                    geometry.faceVertexUvs[0][3] = [right[1], right[0], right[3]];

                    geometry.faceVertexUvs[0][4] = [top[2], top[1], top[3]];
                    geometry.faceVertexUvs[0][5] = [top[1], top[0], top[3]];

                    geometry.faceVertexUvs[0][6] = [bottom[2], bottom[1], bottom[3]];
                    geometry.faceVertexUvs[0][7] = [bottom[1], bottom[0], bottom[3]];

                    geometry.faceVertexUvs[0][8] = [front[2], front[1], front[3]];
                    geometry.faceVertexUvs[0][9] = [front[1], front[0], front[3]];

                    geometry.faceVertexUvs[0][10] = [back[2], back[1], back[3]];
                    geometry.faceVertexUvs[0][11] = [back[1], back[0], back[3]];
                }
            }
        }
        else {
            geometry = new THREE.SphereGeometry(10, 12, 12);
            geometry.scale(-1, 1, 1);

            video = document.createElement('video');
            video.style.visibility = 'true';
            video.width = 960;
            video.height = 480;
            if (isLoop)
                video.loop = true;
            else
                video.loop = false;
            video.muted = true;
            //	        video.preload = 'auto';
            video.src = str;
            video.setAttribute('crossorigin', 'anonymous');
            video.load();

            videoImage = document.createElement('canvas');
            videoImage.width = 960;
            videoImage.height = 480;
            videoImageContext = videoImage.getContext('2d');
            videoImageContext.textAlign = 'center';
            videoImageContext.fillStyle = '#00ff00';
            videoImageContext.fillRect(0, 0, videoImage.width, videoImage.height);
            if (isIphone || isIpad) {
                video.autoplay = false;
                video.setAttribute('webkit-playsinline', 'webkit-playsinline');
                video.currentTime = 0;
                videoImageContext.drawImage(video, 0, 0, videoImage.width, videoImage.height);
                texture = new THREE.VideoTexture(videoImage);
                texture.format = THREE.RGBFormat;
            }
            else {
                texture = new THREE.VideoTexture(video);
                //	            video.pause();
                //	            console.log("set texture");
            }
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;

            //	        console.log("set material");
            material = new THREE.MeshBasicMaterial({ map: texture, overdraw: true });
        }
    };

    sopaOpen.prototype.render = function () {
        var that = this;
        var tmpStr, myStr, strTmp;
        var alpha;
        var current = sopa.currentOffset();
        var ttl = sopa.totalOffset();
        var delta = ttl - former;
        total += delta;
        former = ttl;
        window.addEventListener('resize', function () { that.onWindowResize(); }, false);
        window.addEventListener('scroll', function () { that.onWindowScroll(); }, false);

        if (!isSS && !video)
            return;

        if (isToplay) {
            isToplay = false;
            if (isSS || !video.paused) {
                if (!isIphone && !isIpad)
                    sopa.Play();    // Start reproduction
            }
            play++;
        }
        if (current < prev) {
            if (numSopaFiles > 1) {
                tmpStr = urlStr.substring(0, urlStr.lastIndexOf('.'));
                if (sopaNum < 10) {
                    myStr = tmpStr + "0" + sopaNum + ".sopa";
                }
                else
                    myStr = "" + tmpStr + sopaNum + ".sopa";
                sopa.setUrl(myStr);
                //	            console.log("Load " + myStr);
                sopa.loadSopaData();                    // Load SOPA data
                if (sopaNum == 1) {
                    total = current;
                    if (!isSS) {
                        video.currentTime = current / sampleRate;       // Audio - video synchronized
                    }
                }
                else if (sopaNum == 0) {
                    if (!isLoop)
                        sopa.setLastLoop(true);
                }
                sopaNum++;
                if (sopaNum >= numSopaFiles) {
                    sopaNum = 0;
                }
            }
            else {
                total = current;
            }
        }
        prev = current;

        if (isSS) {
            if (!isStill) {
                var num = parseInt(total / sampleInterval);
                if (num == imgNum + 1 || num < imgNum) {
                    imgNum = num;
                    if (imgNum >= numImages) {
                        imgNum = 0;
                    }
                    if (isLoaded) {
                        if (imgNum == 0) {
                            strTmp = imgStr;
                        }
                        else if (imgNum < 10)
                            strTmp = imgStr.substring(0, imgStr.length - 4) + "000" + imgNum + ".jpg";
                        else if (imgNum < 100)
                            strTmp = imgStr.substring(0, imgStr.length - 4) + "00" + imgNum + ".jpg";
                        else if (imgNum < 1000)
                            strTmp = imgStr.substring(0, imgStr.length - 4) + "0" + imgNum + ".jpg";
                        else
                            strTmp = imgStr;
                        that.getImage(strTmp);
                    }
                }
            }
        }
        else {
            if (isWait) {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    isWait = false;
                }
            }
            else {
                if (isOpr && play == -1 && video.currentTime > 0) {
                    video.pause();
                    play = 3;
                    text2.innerHTML = "Tap to start<BR>Please use stereo headphones";
                }

                if (isIphone || isIpad) {
                    video.currentTime = total / sampleRate;
                    videoImageContext.drawImage(video, 0, 0, videoImage.width, videoImage.height);
                }
                if (texture)
                    texture.needsUpdate = true;
            }
        }
        requestAnimationFrame(function () { that.render(); });

        if (isMobile) {
            //      	gcontrols.connect();
            gcontrols.update();
            if (isInit) {
                cube.rotateY(-camera.rotation.y);
                if (isIphone || isIpad) {
                    if (window.orientation == -90) {
                        isRight = true;
                        //	                    alert("Wrong orientation!");
                        //	                    cube.rotateY(Math.PI);
                    }
                    else if (window.orientation == 180) {
                        isDown = true;
                        alert("Device orientation not supported!\nChange the device orientation and try again.");
                        cube.rotateY(Math.PI);
                    }
                    else if (window.orientation == 0) {
                        isUp = true;
                        cube.rotateY(Math.PI);
                    }
                }
                else {
                    var orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
                    if (orientation.type == 'landscape-secondary') {
                        //	                    screen.lockOrientation('landscape-secondary');
                        isRight = true;
                        //	                    cube.rotateY(Math.PI);
                    }
                    else if (orientation.type == 'portrait-secondary') {
                        //	                    screen.lockOrientation('portrait-secondary');
                        isDown = true;
                        cube.rotateY(rightAngle);
                        //	                    alert("Upside down");
                    }
                    else if (orientation.type == 'portrait-primary') {
                        //	                    screen.lockOrientation('portrait-primary');
                        cube.rotateY(-rightAngle);
                        isUp = true;
                    }
                }
                isInit = false;
            }
            if (isRight) {
                if (isIphone || isIpad)
                    alpha = camera.rotation.y + rightAngle;
                else
                    alpha = camera.rotation.y + rightAngle;
                camera.rotation.x += offsetGamma;
            }
            else if (isDown) {
                if (isIphone || isIpad)
                    alpha = camera.rotation.y;
                else
                    alpha = camera.rotation.y + rightAngle;
                camera.rotation.x -= offsetBeta;
            }
            else if (isUp) {
                if (isIphone || isIpad)
                    alpha = camera.rotation.y - Math.PI;
                else
                    alpha = camera.rotation.y + rightAngle;
                camera.rotation.x += offsetBeta;
            }
            else {
                if (isIphone || isIpad)
                    alpha = camera.rotation.y - rightAngle;
                else
                    alpha = camera.rotation.y - rightAngle;
                camera.rotation.x -= offsetGamma;
            }
            if (camera.rotation.x > rightAngle)
                camera.rotation.x = rightAngle;
            else if (camera.rotation.x < -rightAngle)
                camera.rotation.x = -rightAngle;

            if (isRight) {
                offsetGamma += moved.y * Math.PI / (width * 2);
                if (offsetGamma >= Math.PI)
                    offsetGamma -= dblPI;
                else if (offsetGamma < -Math.PI)
                    offsetGamma += dblPI;

                cube.rotateY(moved.x * Math.PI / (width * 2));
                yaw -= moved.x * Math.PI / (width * 2);
                if (yaw < -Math.PI)
                    yaw += dblPI;
                else if (yaw >= Math.PI)
                    yaw -= dblPI;
            }
            else if (isUp) {
                offsetBeta += moved.y * Math.PI / (width * 2);
                if (offsetBeta >= Math.PI)
                    offsetBeta -= dblPI;
                else if (offsetBeta < -Math.PI)
                    offsetBeta += dblPI;

                cube.rotateY(-moved.x * Math.PI / (width * 2));
                yaw += moved.x * Math.PI / (width * 2);
                if (yaw >= Math.PI)
                    yaw -= dblPI;
                else if (yaw < -Math.PI)
                    yaw += dblPI;
            }
            else if (isDown) {
                offsetBeta -= moved.y * Math.PI / (width * 2);
                if (offsetBeta < -Math.PI)
                    offsetBeta += dblPI;
                else if (offsetBeta >= Math.PI)
                    offsetBeta -= dblPI;

                cube.rotateY(-moved.x * Math.PI / (width * 2));
                yaw += moved.x * Math.PI / (width * 2);
                if (yaw < -Math.PI)
                    yaw += dblPI;
                else if (yaw >= Math.PI)
                    yaw -= dblPI;
            }
            else {
                offsetGamma -= moved.y * Math.PI / (width * 2);
                if (offsetGamma < -Math.PI)
                    offsetGamma += dblPI;
                else if (offsetGamma >= Math.PI)
                    offsetGamma -= dblPI;

                cube.rotateY(-moved.x * Math.PI / (width * 2));
                yaw += moved.x * Math.PI / (width * 2);
                if (yaw >= Math.PI)
                    yaw -= dblPI;
                else if (yaw < -Math.PI)
                    yaw += dblPI;
            }
            //	        offsetGamma += Math.PI / 300;
            moved.y = 0;
            moved.x = 0;
            camera.rotation.z = 0;
        }
        else {
            if (isInit) {
                camera.rotation.y += Math.PI;
                isInit = false;
            }
            camera.rotation.y -= mPosition.x * motionRate;
            if (camera.rotation.x <= Math.PI / 3 && camera.rotation.x >= -Math.PI / 3)
                camera.rotation.x -= mPosition.y * motionRate;
            else if (camera.rotation.x > Math.PI / 3)
                camera.rotation.x = Math.PI / 3;
            else
                camera.rotation.x = -Math.PI / 3;

            if (camera.rotation.y >= dblPI)
                camera.rotation.y -= dblPI;
            else if (camera.rotation.y < 0)
                camera.rotation.y += dblPI;
            alpha = camera.rotation.y;
        }
        alpha += yaw;
        var gamma = camera.rotation.x;
        if (alpha < 0)
            alpha += dblPI;
        else if (alpha >= dblPI)
            alpha -= dblPI;
        var hor = alpha * 180 / Math.PI;
        hor -= 180;
        var ver = gamma * 180 / Math.PI;
        var incre = Math.abs(horizontalAngle - parseInt(hor));
        if (incre > 3) {
            horizontalAngle = parseInt(hor);
            sopa.setPan(horizontalAngle);
            if (!isMobile) {
                isMoving = true;
                //	            console.log("horizontalAngle " + horizontalAngle);
            }
        }
        incre = Math.abs(verticalAngle - parseInt(ver));
        if (incre > 3 && incre < 180) {
            verticalAngle = parseInt(ver);
            sopa.setTilt(verticalAngle);
            if (!isMobile) {
                isMoving = true;
                //	            console.log("verticalAngle " + verticalAngle);
            }
        }
        that.interv();
        renderer.render(scene, camera);
    };

    sopaOpen.prototype.onWindowResize = function () {
        camera.aspect = (window.innerWidth * ratio) / (window.innerHeight * ratioY);
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth * ratio, window.innerHeight * ratioY);
        width = window.innerWidth;
        height = window.innerHeight;
        marginX = width * (1 - ratio) / 2;
        element = document.getElementById('stage');
        rect = element.getBoundingClientRect();
        clHeight = rect.bottom - rect.top;
    };

    sopaOpen.prototype.onWindowScroll = function () {
        scrY = window.pageYOffset;
    }

    sopaOpen.prototype.interv = function () {
        if (play == 4 && !sopa.beingPlayed()) {
            //	        console.log("Finished");
            if (isSS && isLoop) {
                text2.innerHTML = urlStr + " was played. <BR>Good bye";
                play++;
            }
            else {
                if (isMobile)
                    text2.innerHTML = urlStr + " was played. <BR>Tap back button to close this window.";
                else
                    text2.innerHTML = urlStr + " was played. <BR>Thank you.";
                play = 2;
            }
            isPlayed = true;
        }
        else if (sopa.fftWinSize() > 0 && sopa.databaseReady() && !isOK) {
            if (isWait)
                return;
            else
                isOK = true;
            play = 3;
            if (!sopa.setup()) {
                //  	            alert("Something wrong!");
                return;
            }
            if (isMobile && isOpr && !isPlayed && !isSS) {
                play = -1;
                text2.innerHTML = "Tap screen<BR>Please use stereo headphones";
                video.currentTime = 0;
            }
            else if (isMobile) {
                text2.innerHTML = "Tap to start<BR>Please use stereo headphones";
            }
            else {
                text2.innerHTML = "Click to start<BR>Please use stereo headphones";
            }
            sampleRate = sopa.getSampleRate();
            prev = sampleRate;
            //  	        console.log("Click to start " + urlStr);
        }
    }

    return sopaOpen;
})();
window.onload = function () {
    new sopaOpen();
};

// Sopa.js version 1.2.8
// JavaScript source code for reproducing a SOPA file
// Created by Kaoru Ashihara
/*
The MIT License (MIT)

Copyright (c) 2019 AIST

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

Sopa = function (url) {
    this.urlStr = url;  // Location of a SOPA file
    var ua = navigator.userAgent.toLowerCase();
    var isPlaying = false;
    var isDatabaseReady = false;
    var isIphone = false;
    var isMobile = false;
    var isLastLoop = false;
    var noError = true;
    var cardioid = 0;   // Directionality Omini;0, Cardioid;1, Hypercardioid;2
    var hrtfStr;    // for the location of HRTF level database file (hrtf3d512.bin)
    var phaseStr;   // for the location of HRTF phase database file (phase3d512.bin)
    var hrtfHttp = new XMLHttpRequest();
    var phaseHttp = new XMLHttpRequest();
    var hrtf_buffer = new Int16Array(130048);   // Array for the HRTF level data
    var phase_buffer = new Int16Array(130048);  // Array for the HRTF phase data
    var sopaArray0, sopaArray1;  // Array for the directional parameters
    var pcmArray0, pcmArray1;   // Array for the PCM data stream
    var header;     // Header of the SOPA file
    var loadNum = 0;
    var playNum;
    var sopaSampleRate = 0;
    var sopaVersion;
    var bufsize = 0;    // Size of AudioContext buffer
    var currentOffset = 0;
    var datanum = 0;
    var originum = 0;
    var processed;
    var sDataL;
    var sDataR;
    var AudioContext;
    var audiocontext;
    var scrproc;
    var sampleRate;     // Sampling rate of the audio device
    var ratio;
    var fftSize = 0;    // FFT window size
    var horizontalAngle = 36;   // Parameter for pan (from 0 to 71)
    var verticalAngle = 18;     // parameter for tilt (from 0 to 35)
    var dHann;          // for window function
    var dirArray = new Array(256);
    var coordVect = new Array();
    var vecFocus = [0, 0, -1];    // Coordinates of the focus direction
    var progress = 0;
    var lStock = new Float32Array(2229);
    var rStock = new Float32Array(2229);
    const rightAngle = Math.PI / 2;

    this.setup = function () {
        var nTilt, nPan;

        if (ua.indexOf('iphone') > -1 || ua.indexOf('ipod') > -1 || ua.indexOf('ipad') > -1) {
            isIphone = true;
            isMobile = true;
        }
        else if (ua.indexOf('android') > -1)
            isMobile = true;

        try {
            AudioContext = window.AudioContext || window.webkitAudioContext;
            audiocontext = new AudioContext();
            this.unlockAudioContext(audiocontext);
        }
        catch (e) {
            alert("Web Audio API is not supported in this browser");
            return (false);
        }

        sampleRate = audiocontext.sampleRate;
        //        console.log("SampleRate " + sampleRate);
        if (sopaSampleRate == 0) {
            alert("SOPA data not available!");
            return (false);
        }
        ratio = sampleRate / sopaSampleRate;
        horizontalAngle = 36;       // Initial value of pan
        verticalAngle = 18;         // Initial value of tilt
        bufsize = 4096;             // Size of audiocontext buffer
        playNum = 0;

        // Prepare window function ****************
        dHann = new Float32Array(fftSize);  // Array for the window function
        var dRamp = fftSize / 3;
        for (var iInt = 0; iInt < fftSize; iInt++) {

            if (iInt < dRamp) {
                dHann[iInt] = (0.54 - Math.cos(Math.PI * iInt / dRamp) * 0.46) / 2;
            }
            else if (iInt >= fftSize - dRamp) {
                dHann[iInt] = (0.54 - Math.cos(Math.PI * (fftSize - iInt) / dRamp) * 0.46) / 2;
            }
            else {
                dHann[iInt] = 1 / 2;
            }
            //            dHann[iInt] = 0.27 - Math.cos(Math.PI * 2 * iInt / fftSize) * 0.23;
        }
        // Prepare coordinates vectors ****************
        for (var iSectNum = 0; iSectNum < 254; iSectNum++) {
            coordVect[iSectNum] = this.initCoord(iSectNum);
        }
        for (var iSect = 0; iSect < 256; iSect++) {
            dirArray[iSect] = new Array(72);
            for (var iPan = 0; iPan < 72; iPan++) {
                dirArray[iSect][iPan] = new Array(36);
                if (iPan >= 36)
                    nPan = Math.PI * (iPan - 36) / 36;
                else
                    nPan = -Math.PI * (36 - iPan) / 36;
                for (var iTilt = -18; iTilt < 18; iTilt++) {
                    nTilt = Math.PI * iTilt / 36;
                    var iVar = this.modifySector(iSect, nPan, nTilt);
                    dirArray[iSect][iPan][iTilt + 18] = Math.floor(iVar);
                    //                    if(iSect == 138 && iTilt == 0)
                    //                        console.log(iSect + " " + iPan + " " + parseInt(iVar));
                }
            }
        }
        scrproc = audiocontext.createScriptProcessor(bufsize, 2, 2);
        return (true);
    }

    this.unlockAudioContext = function (audioCtx) {
        if (audioCtx.state !== 'suspended') return;
        const b = document.body;
        const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];
        events.forEach(e => b.addEventListener(e, unlock, false));
        function unlock() { audioCtx.resume().then(clean); }
        function clean() { events.forEach(e => b.removeEventListener(e, unlock)); }
    };

    /*
    /   Database preparation
    */
    this.loadDatabase = function (hrtf, phase) {
        hrtfStr = hrtf;
        phaseStr = phase;
        hrtfHttp.open("GET", hrtfStr, true);
        hrtfHttp.responseType = "arraybuffer";
        hrtfHttp.onreadystatechange = this.handleHrtf;
        hrtfHttp.send(null);
        phaseHttp.open("GET", phaseStr, true);
        phaseHttp.responseType = "arraybuffer";
        phaseHttp.onreadystatechange = this.handlePhase;
        phaseHttp.send(null);
    }

    Sopa.prototype.handleHrtf = function () {
        var that = this;
        if (hrtfHttp.readyState == 4 && hrtfHttp.status == 200) {
            hrtf_buffer = new Int16Array(hrtfHttp.response); // HRTF (amplitude) data
            //            console.log("Hrtf data loaded " + hrtf_buffer.byteLength);
            progress++;
            if (progress > 1)
                isDatabaseReady = true;
        }
    };

    Sopa.prototype.handlePhase = function () {
        var that = this;
        if (phaseHttp.readyState == 4 && phaseHttp.status == 200) {
            phase_buffer = new Int16Array(phaseHttp.response); // HRTF (phase) data
            //            console.log("Phase data loaded " + phase_buffer.byteLength);
            progress++;
            if (progress > 1)
                isDatabaseReady = true;
        }
    };

    /**
    /   Method to load SOPA data
    */
    this.loadSopaData = function () {
        this.loadSopa(this.handleSopa);
    };

    Sopa.prototype.loadSopa = function (back) {
        var _this = this;
        var sopaHttp = new XMLHttpRequest();
        //        console.log("Loading SOPA file " + this.urlStr);
        sopaHttp.open("GET", this.urlStr, true);
        sopaHttp.responseType = "arraybuffer";
        sopaHttp.onreadystatechange = function () {
            if (sopaHttp.readyState != 4)
                return;
            if (sopaHttp.status != 200 && sopaHttp.readyState == 4) {
                alert('HTTP error ' + sopaHttp.status);
                return;
            }
            back.call(_this, sopaHttp);
        };
        sopaHttp.send(null);
    };

    Sopa.prototype.handleSopa = function (req) {
        var that = this;
        var sopa_buffer = req.response;
        var dataview = new DataView(sopa_buffer);
        var sampleNum = (dataview.byteLength - 44) / 4;
        header = new Uint8Array(sopa_buffer, 0, 44);                            // Header of the SOPA file
        if (loadNum == 0) {
            sopaArray0 = new Uint8Array(sopa_buffer, 44, sampleNum * 4);              // Directional data array
            pcmArray0 = new Int16Array(sopa_buffer, 44, sampleNum * 2);                   // PCM data array
        }
        else {
            sopaArray1 = new Uint8Array(sopa_buffer, 44, sampleNum * 4);              // Directional data array
            pcmArray1 = new Int16Array(sopa_buffer, 44, sampleNum * 2);                   // PCM data array
        }

        //        console.log("Number of samples " + pcmArray0.length);
        if (originum == 0) {
            if (!that.checkHeader())
                noError = false;
            else
                noError = true;
        }
        if (loadNum == 0)
            loadNum = 1;
        else
            loadNum = 0;
    };

    Sopa.prototype.checkHeader = function () {
        var compU = new Uint8Array(4);
        var chunkSize;

        for (i = 8; i < 12; i++) {
            compU[i - 8] = header[i];
        }
        if (compU[0] != 83 || compU[1] != 79 || compU[2] != 80 || compU[3] != 65) {
            alert("Data format error!");
            return (false);
        }

        for (i = 12; i < 15; i++) {
            compU[i - 12] = header[i];
        }
        if (compU[0] != 102 || compU[1] != 109 || compU[2] != 116) {
            alert("Data format error!");
            return (false);
        }

        if (header[16] != 16) {
            alert("PCM data should be 16-bit depth!");
            return (false);
        }

        sopaSampleRate = header[25] & 0x000000ff;
        sopaSampleRate *= 256;
        sopaSampleRate += header[24] & 0xff;
        if (sopaSampleRate != 22050 && sopaSampleRate != 44100) {
            alert("Wrong sampleRate! " + sopaSampleRate);
            return (false);
        }

        //        console.log("Version " + header[39] + "." + header[38] + "." + header[37]);
        sopaVersion = header[39];
        if (sopaVersion < 2) {
            alert("Sorry, this version is not supported");
            return (false);
        }
        //        console.log("Version " + sopaVersion);

        chunkSize = header[43] & 0x000000ff;
        chunkSize *= 16777216;
        var lLong = header[42] & 0x000000ff;
        lLong *= 65536;
        chunkSize += lLong;
        lLong = header[41] & 0x000000ff;
        lLong *= 256;
        chunkSize += lLong;
        chunkSize += header[40];

        //        return (false);
        if (fftSize == 0) {
            var i = 5;
            while (sopaArray0[i] != 255 && i <= 4096)
                i += 4;
            fftSize = i - 1;                // FFT size
            if (fftSize > 4096) {
                alert("Something wrong!");
                return (false);
            }
            //            console.log("FFT size " + fftSize);
            sDataL = new Float32Array(fftSize);
            sDataR = new Float32Array(fftSize);
        }

        return (true);
    };

    this.fftWinSize = function () {
        if (noError)
            return fftSize;
        else
            return (0);
    }

    this.databaseReady = function () {
        return isDatabaseReady;
    }

    this.beingPlayed = function () {
        return isPlaying;
    }

    /*
    /   Method to start and stop reproduction
    */
    this.Play = function () {
        this.play();
    }

    /*
    /   Getter of currentOffset
    */
    this.currentOffset = function () {
        return currentOffset;
    }

    /*
    /   Getter of total samples played
    */
    this.totalOffset = function () {
        return originum;
    }

    /*
    /   Getter of sample rate
    */
    this.getSampleRate = function () {
        return sopaSampleRate;
    }

    /*
    /   Setter of isLastLoop
    */
    this.setLastLoop = function (isThis) {
        isLastLoop = isThis;
    }

    /*
    /   Setter of the URL of SOPA file
    */
    this.setUrl = function (url) {
        this.urlStr = url;
    }

    /*
    /   Setter of the pan variable
    */
    this.setPan = function (deg) {
        if (deg > 179)
            deg = 179;
        else if (deg < -180)
            deg = -180;
        horizontalAngle = Math.floor(36 + deg / 5);
    }

    /*
    /   Setter of the tilt variable
    */
    this.setTilt = function (deg) {
        if (deg > 89)
            deg = 89;
        else if (deg < -90)
            deg = -90;
        verticalAngle = Math.floor(18 + deg / 5);
    }

    /*
    /   Setter of directionality
    */
    this.setCardioid = function (card, focusHor, focusVer) {
        var forcus;
        cardioid = card;

        if (focusHor == undefined)
            focus = -Math.PI;
        else
            focus = focusHor - Math.PI;
        if (focusVer == undefined)
            focusVer = 0;

        vecFocus[0] = Math.sin(focus);
        vecFocus[1] = Math.sin(focusVer);
        vecFocus[2] = Math.cos(focus);
    }

    Sopa.prototype.play = function () {
        var _this = this;

        if (!isPlaying) {
            originum = 0;
            datanum = 0;
            currentOffset = 0;
            currenttime = 0;
            playNum = 0;
            processed = 0;

            /* for iPhone, iPod touch and iPad
            if (isIphone) {
                var dummy = audiocontext.createBufferSource();
                dummy.start(0);
                dummy.connect(scrproc);
            }   */

            scrproc.onaudioprocess = function (audioProcessingEvent) {
                _this.Process.call(_this, audioProcessingEvent);
            };
            if (isIphone)
                audiocontext.createBufferSource().start(0);

            // Start reproduction
            isPlaying = true;
            scrproc.connect(audiocontext.destination);
        }
        else {
            // Stop reproduction
            scrproc.disconnect(audiocontext.destination);
            scrproc.onaudioprocess = null;
            isPlaying = false;
        }
    };

    /*
    /   Callback loop
    */
    Sopa.prototype.Process = function (event) {
        var _this = this;
        var iSize = fftSize;
        var wSize = fftSize * 2;
        var proc = iSize / 2;
        var Nyq = iSize / 2;
        var sPeriod = 1 / sampleRate;
        var dir;
        var dirsec;
        var dil;
        var dilsec;
        var iMirror;
        var iRatio = (44100 * iSize) / (sopaSampleRate * 512);
        var iFreq;
        var iImg;
        var dSpR;
        var dSpL;
        var dSpImageR;
        var dSpImageL;
        var dPhaseR;
        var dPhaseL;
        var dPhaseImageR;
        var dPhaseImageL;
        var dPhase = 0;
        var iNumber;
        var iSecond;
        var iNumImage;
        var iSecondImage;
        var iBin;
        var nAtt = 2048.0;
        var dWeight = new Array(2);
        var dReR = new Float32Array(iSize);
        var dReL = new Float32Array(iSize);
        var dImR = new Float32Array(iSize);
        var dImL = new Float32Array(iSize);
        var buf0 = event.outputBuffer.getChannelData(0);
        var buf1 = event.outputBuffer.getChannelData(1);
        var stock = processed - datanum;
        var sub = lStock.subarray(0, stock);
        var pcmsub, pcmnew, pcmadd, pcmtarg;
        var currSample;

        buf0.set(sub, 0);
        sub = rStock.subarray(0, stock);
        buf1.set(sub, 0);
        datanum += stock;
        currenttime = datanum / sampleRate;
        var frames = Math.ceil((bufsize - stock) / (ratio * proc));
        var count = stock;
        for (var frm = 0; frm < frames; frm++) {
            currSample = currentOffset * 2;
            if (playNum == 0) {
                if (currSample + wSize > pcmArray0.length) {
                    pcmtarg = pcmArray0.subarray(currSample, pcmArray0.length);
                    if (pcmArray1 != null)
                        pcmadd = pcmArray1.subarray(0, currSample + wSize - pcmArray0.length);
                    else
                        pcmadd = pcmArray0.subarray(0, currSample + wSize - pcmArray0.length);
                    pcmnew = new Int16Array(pcmtarg.length + pcmadd.length);
                    pcmnew.set(pcmtarg);
                    pcmnew.set(pcmadd, pcmtarg.length);
                }
                else
                    pcmnew = pcmArray0.subarray(currSample, currSample + wSize);
            }
            else {
                if (currSample + wSize > pcmArray1.length) {
                    pcmtarg = pcmArray1.subarray(currSample, pcmArray1.length);
                    pcmadd = pcmArray0.subarray(0, currSample + wSize - pcmArray1.length);
                    pcmnew = new Int16Array(pcmtarg.length + pcmadd.length);
                    pcmnew.set(pcmtarg);
                    pcmnew.set(pcmadd, pcmtarg.length);
                }
                else
                    pcmnew = pcmArray1.subarray(currSample, currSample + wSize);
            }
            var pcm = new Float32Array(fftSize);
            var image = new Float32Array(fftSize);
            for (iBin = 0; iBin < fftSize; iBin++)
                pcm[iBin] = pcmnew[iBin * 2 + 1];
            var newObj = { "real": pcm, "image": image };
            this.fastFt(newObj, false);
            var address = currSample * 2;
            var addNyq = address + iSize;
            dReL[Nyq] = pcm[Nyq] * Math.cos(image[Nyq]);
            dReR[Nyq] = pcm[Nyq] * Math.cos(image[Nyq]);
            dImL[Nyq] = pcm[Nyq] * Math.sin(image[Nyq]);
            dImR[Nyq] = pcm[Nyq] * Math.sin(image[Nyq]);
            for (iBin = 0; iBin < Nyq; iBin++) {
                iMirror = iSize - iBin;
                iFreq = Math.floor(iBin / iRatio);
                if (iFreq == 0)
                    iImg = iFreq;
                else
                    iImg = 512 - iFreq;
                if (playNum == 0) {
                    if (iBin % 2 == 0)
                        dir = sopaArray0[address + iBin * 2 + 1];
                    else
                        dir = sopaArray0[address + (iBin - 1) * 2];
                }
                else {
                    if (iBin % 2 == 0)
                        dir = sopaArray1[address + iBin * 2 + 1];
                    else
                        dir = sopaArray1[address + (iBin - 1) * 2];
                }
                if (sopaVersion < 3) {
                    dirsec = dir;
                }
                else {
                    if (playNum == 0) {
                        if (iBin % 2 == 0)
                            dirsec = sopaArray0[addNyq + iBin * 2 + 1];
                        else
                            dirsec = sopaArray0[addNyq + (iBin - 1) * 2];
                    }
                    else {
                        if (iBin % 2 == 0)
                            dirsec = sopaArray1[addNyq + iBin * 2 + 1];
                        else
                            dirsec = sopaArray1[addNyq + (iBin - 1) * 2];
                    }
                }
                if (iFreq == 0) {
                    dSpR = dSpL = pcm[iBin];
                    dPhaseL = dPhaseR = image[iBin];
                    if (iBin > 0) {
                        dSpImageL = dSpImageR = pcm[iMirror];
                        dPhaseImageL = dPhaseImageR = image[iMirror];
                    }
                }
                else if (dir >= 254 && dirsec >= 254) {
                    dSpR = dSpL = pcm[iBin];
                    dPhaseL = dPhaseR = image[iBin];
                    dSpImageL = dSpImageR = pcm[iMirror];
                    dPhaseImageL = dPhaseImageR = image[iMirror];
                }
                else {
                    if (dir > 253)
                        dir = dirsec;
                    else if (dirsec > 253)
                        dirsec = dir;
                    if (dir >= 0 && dir < 256) {
                        dir = dirArray[dir][horizontalAngle][verticalAngle];
                        dil = this.opposit(dir);
                        dirsec = dirArray[dirsec][horizontalAngle][verticalAngle];
                        dilsec = this.opposit(dirsec);
                        if (cardioid > 0) {
                            var coord = this.initCoord(dir);
                            var inate = this.initCoord(dirsec);
                            dWeight[0] = this.weight(vecFocus, coord);
                            dWeight[1] = this.weight(vecFocus, inate);
                            dPhase = 0;
                        }
                        else {
                            dWeight[0] = dWeight[1] = 1;
                            dPhase = 0;
                        }
                        dWeight[0] /= nAtt;
                        dWeight[1] /= nAtt;
                    }

                    iNumber = 512 * dir + iFreq;
                    iNumImage = 512 * dir + iImg;
                    var nPwr = hrtf_buffer[iNumber] * dWeight[0];
                    iSecond = 512 * dirsec + iFreq;
                    iSecondImage = 512 * dirsec + iImg;
                    nPwr += hrtf_buffer[iSecond] * dWeight[1];
                    nPwr /= 2;
                    dSpR = pcm[iBin] * nPwr;
                    var nPhase = phase_buffer[iNumber] / 10000.0;
                    nPhase += phase_buffer[iSecond] / 10000.0;
                    nPhase /= 2.0;
                    if (Math.abs(phase_buffer[iNumber] - phase_buffer[iSecond]) > 31416) {
                        if (nPhase < 0)
                            nPhase += Math.PI;
                        else
                            nPhase -= Math.PI;
                    }
                    dPhaseR = image[iBin] + nPhase + dPhase;
                    nPwr = hrtf_buffer[iNumImage] * dWeight[0];
                    nPwr += hrtf_buffer[iSecondImage] * dWeight[1];
                    nPwr /= 2;
                    dSpImageR = pcm[iMirror] * nPwr;
                    nPhase = phase_buffer[iNumImage] / 10000.0;
                    nPhase += phase_buffer[iSecondImage] / 10000.0;
                    nPhase /= 2.0;
                    if (Math.abs(phase_buffer[iNumImage] - phase_buffer[iSecondImage]) > 31416) {
                        if (nPhase < 0)
                            nPhase += Math.PI;
                        else
                            nPhase -= Math.PI;
                    }
                    dPhaseImageR = image[iMirror] + nPhase - dPhase;
                    iNumber = 512 * dil + iFreq;
                    iNumImage = 512 * dil + iImg;
                    nPwr = hrtf_buffer[iNumber] * dWeight[0];
                    iSecond = 512 * dilsec + iFreq;
                    iSecondImage = 512 * dilsec + iImg;
                    nPwr += hrtf_buffer[iSecond] * dWeight[1];
                    nPwr /= 2;
                    dSpL = pcm[iBin] * nPwr;
                    nPhase = phase_buffer[iNumber] / 10000.0;
                    nPhase += phase_buffer[iSecond] / 10000.0;
                    nPhase /= 2.0;
                    if (Math.abs(phase_buffer[iNumber] - phase_buffer[iSecond]) > 31416) {
                        if (nPhase < 0)
                            nPhase += Math.PI;
                        else
                            nPhase -= Math.PI;
                    }
                    dPhaseL = image[iBin] + nPhase + dPhase;
                    nPwr = hrtf_buffer[iNumImage] * dWeight[0];
                    nPwr += hrtf_buffer[iSecondImage] * dWeight[1];
                    nPwr /= 2;
                    dSpImageL = pcm[iMirror] * nPwr;
                    nPhase = phase_buffer[iNumImage] / 10000.0;
                    nPhase += phase_buffer[iSecondImage] / 10000.0;
                    nPhase /= 2.0;
                    if (Math.abs(phase_buffer[iNumImage] - phase_buffer[iSecondImage]) > 31416) {
                        if (nPhase < 0)
                            nPhase += Math.PI;
                        else
                            nPhase -= Math.PI;
                    }
                    dPhaseImageL = image[iMirror] + nPhase - dPhase;
                }
                dReL[iBin] = dSpL * Math.cos(dPhaseL);
                dReR[iBin] = dSpR * Math.cos(dPhaseR);
                dImL[iBin] = dSpL * Math.sin(dPhaseL);
                dImR[iBin] = dSpR * Math.sin(dPhaseR);
                if (iBin > 0) {
                    dReL[iMirror] = dSpImageL * Math.cos(dPhaseImageL);
                    dReR[iMirror] = dSpImageR * Math.cos(dPhaseImageR);
                    dImL[iMirror] = dSpImageL * Math.sin(dPhaseImageL);
                    dImR[iMirror] = dSpImageR * Math.sin(dPhaseImageR);
                }
            }
            newObj = { "real": dReL, "image": dImL };
            this.fastFt(newObj, true);
            newObj = { "real": dReR, "image": dImR };
            this.fastFt(newObj, true);
            for (iBin = 0; iBin < iSize; iBin++) {
                // Hann window
                dReL[iBin] *= dHann[iBin];
                dReR[iBin] *= dHann[iBin];
                // Overlap and add
                sDataL[iBin] += dReL[iBin];
                sDataR[iBin] += dReR[iBin];
            }
            for (iBin = 0; iBin < proc; iBin++) {
                var offset = iBin * ratio;
                var newL = sDataL[iBin + 1] / 32768;
                var newR = sDataR[iBin + 1] / 32768;
                var valL = sDataL[iBin] / 32768;
                var valR = sDataR[iBin] / 32768;
                var origitime = originum / sopaSampleRate;
                while (currenttime < origitime) {
                    var prop = (origitime - currenttime) * sopaSampleRate;
                    var nowL = (valL * prop) + (newL * (1 - prop));
                    var nowR = (valR * prop) + (newR * (1 - prop));
                    if (count < bufsize) {
                        buf0[count] = nowL;
                        buf1[count] = nowR;
                        datanum++;
                        currenttime = datanum / sampleRate;
                    }
                    else {
                        lStock[count - bufsize] = nowL;
                        rStock[count - bufsize] = nowR;
                        currenttime += sPeriod;
                    }
                    count++;
                    processed++;
                }
                originum++;
            }
            pcmsub = sDataL.subarray(proc);
            sDataL = new Float32Array(fftSize);
            sDataL.set(pcmsub, 0);
            pcmsub = sDataR.subarray(proc);
            sDataR = new Float32Array(fftSize);
            sDataR.set(pcmsub, 0);
            var stream;
            if (playNum == 0)
                stream = pcmArray0.length / 2;
            else
                stream = pcmArray1.length / 2;
            if (currentOffset + proc >= stream) {
                if (!isLastLoop) {
                    currentOffset = 0;
                    if (playNum == 0 && pcmArray1)
                        playNum = 1;
                    else
                        playNum = 0;
                }
                else {
                    frm = frames;
                    _this.play();
                }
            }
            else
                currentOffset += proc;
        }
    };

    /*
    /   Fourier transform
    */
    Sopa.prototype.fastFt = function (ret, isInv) {
        var sc;
        var f;
        var c;
        var s;
        var t;
        var c1;
        var s1;
        var x1;
        var kyo1;
        var dHan;
        var dPower;
        var dPhase;
        var n;
        var j;
        var i;
        var k;
        var ns;
        var l1;
        var i0;
        var i1;
        var iInt;
        var iTap = fftSize;
        var dWpi = Math.PI * 2;
        var dData = ret["real"];
        var dImg = ret["image"];
        if (!isInv) {
            for (iInt = 0; iInt < iTap; iInt++) {
                dImg[iInt] = 0; // Imaginary part 
                dHan = (1 - Math.cos((dWpi * iInt) / iTap)) / 2; // Hanning Window 
                dData[iInt] *= dHan; // Real part 
            }
        }
        /*	printf("******************** Arranging BIT ******************\n"); */
        n = iTap; /* NUMBER of DATA */
        sc = Math.PI;
        j = 0;
        for (i = 0; i < n - 1; i++) {
            if (i <= j) {
                t = dData[i];
                dData[i] = dData[j];
                dData[j] = t;
                t = dImg[i];
                dImg[i] = dImg[j];
                dImg[j] = t;
            }
            k = n / 2;
            while (k <= j) {
                j = j - k;
                k /= 2;
            }
            j += k;
        }
        /*	printf("******************** MAIN LOOP **********************\n"); */
        ns = 1;
        if (isInv)
            f = 1.0;
        else
            f = -1.0;
        while (ns <= n / 2) {
            c1 = Math.cos(sc);
            s1 = Math.sin(f * sc);
            c = 1.0;
            s = 0.0;
            for (l1 = 0; l1 < ns; l1++) {
                for (i0 = l1; i0 < n; i0 += (2 * ns)) {
                    i1 = i0 + ns;
                    x1 = (dData[i1] * c) - (dImg[i1] * s);
                    kyo1 = (dImg[i1] * c) + (dData[i1] * s);
                    dData[i1] = dData[i0] - x1;
                    dImg[i1] = dImg[i0] - kyo1;
                    dData[i0] = dData[i0] + x1;
                    dImg[i0] = dImg[i0] + kyo1;
                }
                t = (c1 * c) - (s1 * s);
                s = (s1 * c) + (c1 * s);
                c = t;
            }
            ns *= 2;
            sc /= 2.0;
        }
        if (!isInv) {
            for (iInt = 0; iInt < iTap; iInt++) {
                dData[iInt] /= iTap;
                dImg[iInt] /= iTap;
                dPower = Math.sqrt(dData[iInt] * dData[iInt] + dImg[iInt] * dImg[iInt]);
                dPhase = Math.atan2(dImg[iInt], dData[iInt]);
                dData[iInt] = dPower;
                dImg[iInt] = dPhase;
            }
        }
    };

    /*
    /   Method returns 3D coordinates of a sector
    */
    Sopa.prototype.initCoord = function (iSector) {
        var coord = new Array(3);
        var nPan, nTilt;
        var nUnitLong;
        var nUnitHori;
        var nHoriAngl;
        var nUnitLat = Math.PI / 12;
        if (iSector >= 127)
            nUnitLat *= -1;
        if (iSector == 0) {
            coord[0] = coord[2] = 0;
            coord[1] = 1;
        }
        else if (iSector == 253) {
            coord[0] = coord[2] = 0;
            coord[1] = -1;
        }
        else if (iSector < 9 || iSector >= 245) {
            nUnitLong = Math.PI / 4.0;
            nUnitHori = Math.cos(nUnitLat * 5);
            coord[1] = Math.sin(nUnitLat * 5);
            if (iSector < 9) {
                nHoriAngl = nUnitLong * (iSector - 1) - Math.PI;
            }
            else {
                nHoriAngl = nUnitLong * (252 - iSector);
            }
            coord[0] = nUnitHori * Math.sin(nHoriAngl);
            coord[2] = nUnitHori * Math.cos(nHoriAngl);
        }
        else if (iSector < 25 || iSector >= 229) {
            nUnitLong = Math.PI / 8;
            nUnitHori = Math.cos(nUnitLat * 4);
            coord[1] = Math.sin(nUnitLat * 4);
            if (iSector < 25) {
                nHoriAngl = nUnitLong * (iSector - 9) - Math.PI;
            }
            else {
                nHoriAngl = nUnitLong * (244 - iSector);
            }
            coord[0] = nUnitHori * Math.sin(nHoriAngl);
            coord[2] = nUnitHori * Math.cos(nHoriAngl);
        }
        else if (iSector < 49 || iSector >= 205) {
            nUnitLong = Math.PI / 12;
            nUnitHori = Math.cos(nUnitLat * 3);
            coord[1] = Math.sin(nUnitLat * 3);
            if (iSector < 49) {
                nHoriAngl = nUnitLong * (iSector - 25) - Math.PI;
            }
            else {
                nHoriAngl = nUnitLong * (228 - iSector);
            }
            coord[0] = nUnitHori * Math.sin(nHoriAngl);
            coord[2] = nUnitHori * Math.cos(nHoriAngl);
        }
        else if (iSector < 79 || iSector >= 175) {
            nUnitLong = Math.PI / 15;
            nUnitHori = Math.cos(nUnitLat * 2);
            coord[1] = Math.sin(nUnitLat * 2);
            if (iSector < 79) {
                nHoriAngl = nUnitLong * (iSector - 49) - Math.PI;
            }
            else {
                nHoriAngl = nUnitLong * (204 - iSector);
            }
            coord[0] = nUnitHori * Math.sin(nHoriAngl);
            coord[2] = nUnitHori * Math.cos(nHoriAngl);
        }
        else if (iSector < 111 || iSector >= 143) {
            nUnitLong = Math.PI / 16;
            nUnitHori = Math.cos(nUnitLat);
            coord[1] = Math.sin(nUnitLat);
            if (iSector < 111) {
                nHoriAngl = nUnitLong * (iSector - 79) - Math.PI;
            }
            else {
                nHoriAngl = nUnitLong * (174 - iSector);
            }
            coord[0] = nUnitHori * Math.sin(nHoriAngl);
            coord[2] = nUnitHori * Math.cos(nHoriAngl);
        }
        else {
            nUnitLong = Math.PI / 16;
            nUnitHori = 1.0;
            coord[1] = 0;
            if (iSector < 127)
                nHoriAngl = nUnitLong * (iSector - 111) - Math.PI;
            else
                nHoriAngl = nUnitLong * (142 - iSector);
            coord[0] = nUnitHori * Math.sin(nHoriAngl);
            coord[2] = nUnitHori * Math.cos(nHoriAngl);
        }
        return coord;
    };

    /*
    /   Calculate the sound image direction from the left ear
    */
    Sopa.prototype.opposit = function (right) {
        if (right == 0 || right >= 253)
            return (right);
        else if (right < 9) {
            if (right == 1)
                return (right);
            else
                return (10 - right);
        }
        else if (right < 25) {
            if (right == 9)
                return (right);
            else
                return (34 - right);
        }
        else if (right < 49) {
            if (right == 25)
                return (right);
            else
                return (74 - right);
        }
        else if (right < 79) {
            if (right == 49)
                return (right);
            else
                return (128 - right);
        }
        else if (right < 111) {
            if (right == 79)
                return (right);
            else
                return (190 - right);
        }
        else if (right < 127) {
            if (right == 111)
                return (right);
            else
                return (15 + right);
        }
        else if (right < 143) {
            if (right == 142)
                return (right);
            else
                return (right - 15);
        }
        else if (right < 175) {
            if (right == 174)
                return (right);
            else
                return (316 - right);
        }
        else if (right < 205) {
            if (right == 204)
                return (right);
            else
                return (378 - right);
        }
        else if (right < 229) {
            if (right == 228)
                return (right);
            else
                return (432 - right);
        }
        else if (right < 245) {
            if (right == 244)
                return (right);
            else
                return (472 - right);
        }
        else {
            if (right == 252)
                return (right);
            else
                return (496 - right);
        }
    };

    /*
    /   Method returns a sector No. after applied pan and tilt
    */
    Sopa.prototype.modifySector = function (iSector, nPan, nTilt) {     // nPan default 0
        var iNewSect;
        var nUnitHori;
        var nHoriAngl = 0;
        if (iSector > 253)
            return iSector;
        if (iSector != 0 && iSector != 253)
            nHoriAngl = Math.atan2(coordVect[iSector][0], coordVect[iSector][2]) + nPan;
        if (iSector == 0 || iSector == 253)
            nUnitHori = 0;
        else if (iSector < 9 || iSector >= 245) {
            nUnitHori = Math.cos(Math.PI * 5 / 12);
        }
        else if (iSector < 25 || iSector >= 229) {
            nUnitHori = Math.cos(Math.PI / 3);
        }
        else if (iSector < 49 || iSector >= 205) {
            nUnitHori = Math.cos(Math.PI / 4);
        }
        else if (iSector < 79 || iSector >= 175) {
            nUnitHori = Math.cos(Math.PI / 6);
        }
        else if (iSector < 111 || iSector >= 143) {
            nUnitHori = Math.cos(Math.PI / 12);
        }
        else
            nUnitHori = 1.0;
        var myCoord = new Array();
        myCoord[0] = nUnitHori * Math.sin(nHoriAngl);
        myCoord[2] = nUnitHori * Math.cos(nHoriAngl);
        myCoord[1] = coordVect[iSector][1];
        //        if (nTilt == 0 || myCoord[2] == 0)                modified 20 Nov 2017
        if (nTilt == 0)
            iNewSect = this.calcSector(myCoord);
        else {
            var xV = myCoord[0];
            var yV = myCoord[1];
            var zV = myCoord[2];
            var xz = Math.sqrt(xV * xV + zV * zV);
            var nVerAngl = Math.atan2(yV, xz) + nTilt;
            var nUnitVer = Math.sqrt(xz * xz + yV * yV);
            myCoord[0] = nUnitVer * Math.cos(nVerAngl) * Math.sin(nHoriAngl);
            myCoord[2] = nUnitVer * Math.cos(nVerAngl) * Math.cos(nHoriAngl);
            myCoord[1] = nUnitVer * Math.sin(nVerAngl);
            iNewSect = this.calcSector(myCoord);
        }
        return iNewSect;
    };

    /*
    /   Getter of the sector number
    */
    Sopa.prototype.calcSector = function (coor) {
        var iSector;
        var nHoriAngl;
        var dWpi = Math.PI * 2;
        if (coor[1] >= Math.sin(Math.PI * 11 / 24))
            return 0;
        else if (coor[1] <= -Math.sin(Math.PI * 11 / 24))
            return 253;
        else {
            nHoriAngl = Math.atan2(-coor[0], -coor[2]);
        }
        if (coor[1] >= Math.sin(Math.PI * 3 / 8)) {
            if (nHoriAngl < 0)
                nHoriAngl += dWpi;
            iSector = 1 + nHoriAngl / (Math.PI / 4);
        }
        else if (coor[1] <= -Math.sin(Math.PI * 3 / 8))
            iSector = 249.0 - nHoriAngl / (Math.PI / 4);
        else if (coor[1] >= Math.sin(Math.PI * 7 / 24)) {
            if (nHoriAngl < 0)
                nHoriAngl += dWpi;
            iSector = 9.0 + nHoriAngl / (Math.PI / 8);
        }
        else if (coor[1] <= -Math.sin(Math.PI * 7 / 24))
            iSector = 237.0 - nHoriAngl / (Math.PI / 8);
        else if (coor[1] >= Math.sin(Math.PI * 5 / 24)) {
            if (nHoriAngl < 0)
                nHoriAngl += dWpi;
            iSector = 25 + nHoriAngl / (Math.PI / 12);
        }
        else if (coor[1] <= -Math.sin(Math.PI * 5 / 24))
            iSector = 217.0 - nHoriAngl / (Math.PI / 12);
        else if (coor[1] >= Math.sin(Math.PI / 8)) {
            if (nHoriAngl < 0)
                nHoriAngl += dWpi;
            iSector = 49 + nHoriAngl / (Math.PI / 15);
        }
        else if (coor[1] <= -Math.sin(Math.PI / 8))
            iSector = 190.0 - nHoriAngl / (Math.PI / 15);
        else if (coor[1] >= Math.sin(Math.PI / 24)) {
            if (nHoriAngl < 0)
                nHoriAngl += dWpi;
            iSector = (79 + nHoriAngl / (Math.PI / 16));
        }
        else if (coor[1] <= -Math.sin(Math.PI / 24))
            iSector = 159.0 - nHoriAngl / (Math.PI / 16);
        else if (nHoriAngl < 0)
            iSector = 127 - nHoriAngl / (Math.PI / 16);
        else {
            if (nHoriAngl == Math.PI)
                iSector = 142;
            else
                iSector = 111 + nHoriAngl / (Math.PI / 16);
        }
        return iSector;
    };

    /*
    /   Get weight value of the target direction
    */
    Sopa.prototype.weight = function (focus, first) {
        var weight0;
        var dot0;
        var dCard0;

        dot0 = focus[0] * first[0] + focus[1] * first[1] + focus[2] * first[2];

        weight0 = (1 + dot0) / 2;

        if (cardioid > 1) {
            weight0 *= dot0;
            if (cardioid > 2) {
                dCard0 = Math.sin(Math.PI * dot0 / 3.0 + Math.PI / 6.0);
                dCard0 *= -Math.cos(Math.PI * dot0 / 3.0 + Math.PI / 3.0) * 2.0;
                weight0 *= dCard0;
            }
        }
        return (weight0);
    };
    /*
        Sopa.prototype.polar = function (focus, first, second) {
            var weight;
            var center = new Array(3);
            var dScal,dCos,dTheta;
            var phdif0,s0;
            var dot0,deg0;
    
            // image direction
            center[0] = first[0] + second[0];
            center[1] = first[1] + second[1];
            center[2] = first[2] + second[2];
    
            dScal = Math.sqrt(center[0] * center[0] + center[1] * center[1] + center[2] * center[2]);
            if (dScal > 0) {
                center[0] /= dScal;
                center[1] /= dScal;
                center[2] /= dScal;
            }
    
            dCos = first[0] * second[0] + first[1] * second[1] + first[2] * second[2];
            if (dCos > 1)
                dCos = 1;
            else if (dCos < -1)
                dCos = -1;
            dTheta = Math.acos(dCos) / 2;
            dCos = Math.cos(dTheta);
    
            // dot product
            dot0 = center[0] * focus[0] + center[1] * focus[1] + center[2] * focus[2];
            if (dot0 > 1)
                dot0 = 1;
            else if (dot0 < -1)
                dot0 = -1;
    
            // phase difference
            deg0 = Math.acos(dot0);
    
            phdif0 = Math.PI * Math.cos(deg0) * dCos - Math.PI;
            phdif0 /= 2;
    
            if (cardioid == 1) {
                weight = (1 + Math.cos(phdif0)) / 2;
            }
            else if (cardioid == 2) {
                s0 = Math.PI * Math.sin(deg0) * dCos * 7 / 18;
                weight = (1 + Math.cos(phdif0)) * Math.cos(s0) / 2;
            }
            else if (cardioid == 3) {
                s0 = Math.PI * Math.sin(deg0) * dCos;
                if(phdif0 < -rightAngle)
                    weight = 0;
                else{
                    weight = (1 + Math.cos(phdif0)) * Math.cos(s0 * 11 / 18) * Math.cos(s0 / 2) * Math.cos(s0 * 5 / 9) / 2;
                    weight *= (1 + Math.cos(phdif0)) / 2;
                }
            }
            return Math.abs(weight);
        };  */

    Sopa.prototype.getUnitVector = function (v0, v1) {
        var vec = [v0[0] + v1[0], v0[1] + v1[1], v0[2] + v1[2]];
        var dL;
        var dot;

        dot = v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
        //        dL = Math.sqrt(v0[0] * v0[0] + v0[1] * v0[1] + v0[2] * v0[2]);
        //        dL *= Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]);
        if (dot > 1)
            vec.push(0);
        else if (dot < -1)
            vec.push(rightAngle);
        else
            vec.push(Math.acos(dot) / 2);
        dL = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
        if (dL > 0) {
            vec[0] /= dL;
            vec[1] /= dL;
            vec[2] /= dL;
        }
        else {
            vec[0] = 0;
            vec[1] = 1;
            vec[2] = 0;
        }
        return vec;
    };

};
