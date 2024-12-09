function Canvas(width = 500, height = 500, locID) {
    //From previous labs
    console.log("Function canvas loaded");

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const parent = locID ? document.getElementById(locID) : document.body;
    parent.appendChild(canvas);
    
    document.body.appendChild(canvas);
    this.height = height;
    this.width = width;
    
    var gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }
    this.gl = gl;
    gl.viewport(0, 0, width, height);
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    //From previous labs
    // Buffers and attributes setup for vertices and colors (or texture coordinates)
    this.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    //From previous labs
    // A buffer for the colors/texture coordinates
    this.cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.cBuffer);
    colorAttribute = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(colorAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorAttribute);
    this.textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
    texCoordAttribute = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(texCoordAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordAttribute);
    
    // This will hold the mode (color or texture)
    this.colorMode = true; // true for color, false for texture
    this.maxDepth = 1;
    this.Init();
    return this;
}
Canvas.prototype = {
    Init: function () {
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.RestartList();
    },
    RestartList: function (useColor = true, image = null) {
        this.currentDepth = 1;
        this.useColor = useColor;
        //this.image = textImage; // Assuming you have an image object or path

        // Define initial triangle vertices

        // Generate random colors for each vertex (if using color mode)
        this.colors = useColor ? [
            vec2(-0.8, -0.8),
            vec2(0, 0.8),
            vec2(0.8, -0.8)
        ].map(() => vec3(Math.random(), Math.random(), Math.random())) : null;

        // Assign initial vertices and call recursive subdivision
        this.vertex = [
            vec2(-0.8, -0.8),
            vec2(0, 0.8),
            vec2(0.8, -0.8)
        ];
        this.MakePoints(this.maxDepth, this.vertex, this.colors);

        this.UpdateBuffers();
        this.Redisplay();
    },
    UpdateBuffers: function () {
        gl = this.gl;
        // change the vertex data
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertex), gl.DYNAMIC_DRAW);
        // change the color data or texture coordinates
        if (this.colorMode) {
            gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(this.colors), gl.DYNAMIC_DRAW);
        } else {
            gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer);
            // Add the texture coordinates (dummy for now, can be adjusted)
            var texCoords = [
                vec2(0, 0),
                vec2(1, 0),
                vec2(0, 1)
            ];
            gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.DYNAMIC_DRAW);
        }
    },
    GetDepth: function () {
        return this.maxDepth;
    },
    ChangeDepth: function (newDepth) {
        var depth = parseInt(newDepth);
        if (depth < 1) {
            alert("depth must be positive");
            return;
        }
        if (depth > 10) {
            alert("Depth has a max value of 10");
            depth = 10;
        }
        if (depth < this.maxDepth) {
            this.maxDepth = depth;
            this.RestartList();
        } else {
            this.maxDepth = depth;
            this.MakePoints();
            var gl = this.gl;
            this.UpdateBuffers();
        }
        this.Redisplay();
    },

    Interp: function (a, b, s) {
        return a * (1 - s) + b * s;
    },

    HalfPoint: function (p1, p2) {
        var x = this.Interp(p1[0], p2[0], .5);
        var y = this.Interp(p1[1], p2[1], .5);
        return vec2(x, y);
    },

    AddTri: function (p1, p2, p3, vert, c1, colors) {
        vert.push(p1);
        colors.push(c1);

        vert.push(p2);
        var c2 = vec3(Math.random(), Math.random(), Math.random());
        colors.push(c2);

        vert.push(p3);
        var c3 = vec3(Math.random(), Math.random(), Math.random());
        colors.push(c3);
    },

    MakePoints: function () {
        const subdivideTriangle = (a, b, c, depth, parentColor, vertexArray, colorArray) => {
            if (depth <= 0) {
                return;
            }

            const p1 = this.HalfPoint(a, b);
            const p2 = this.HalfPoint(a, c);
            const p3 = this.HalfPoint(b, c);

            // Assign colors to the new triangles
            const color1 = parentColor;
            const color2 = vec3(Math.random(), Math.random(), Math.random());
            const color3 = vec3(Math.random(), Math.random(), Math.random());

            // Add new vertices and colors to the arrays
            vertexArray.push(a, p1, p2, b, p1, p3, c, p2, p3);
            colorArray.push(color1, color2, color3, color2, color3, color1);

            subdivideTriangle(a, p1, p2, depth - 1, color1, vertexArray, colorArray);
            subdivideTriangle(b, p1, p3, depth - 1, color2, vertexArray, colorArray);
            subdivideTriangle(c, p2, p3, depth - 1, color3, vertexArray, colorArray);
        };

        subdivideTriangle(this.vertex[0], this.vertex[1], this.vertex[2], this.maxDepth, this.colors[0], this.vertex, this.colors);
        this.UpdateBuffers();
        this.Redisplay();
    },

    Redisplay: function () {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Bind vertex buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertex), this.gl.STATIC_DRAW);

        // Bind color buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.colors), this.gl.STATIC_DRAW);

        // Set vertex and color attributes
        // ... (attribute setup code)

        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertex.length);
    },

    // Switch between color and texture mode
    switchToImage: function () {
        this.colorMode = !this.colorMode; // Toggle between color and texture mode
        this.RestartList();
    }
};
