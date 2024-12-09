function Canvas(width, height, locID) {

    if (width == undefined || width < 0) {
       width = 300;
    }

    if (height == undefined || height < 0) {
       height = 300;
    }

    var canvas = document.createElement('canvas')
        canvas.height = height;
        canvas.width = width;

    if(locID == undefined) {
        document.body.appendChild(canvas);
    } else {
        div = document.getElementById(locID);
        if (null == div) {
            document.body.appendChild(canvas);
        } else {
            div.appendChild(canvas);
        }
    }

    document.body.appendChild(canvas);

    this.height = height;
    this.width = width;

    // new stuff
    var gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert ("WebGL isn't available");
    }

    this.gl = gl;

    gl.viewport(0,0, width, height);

    program = initShaders(gl, "vertex-shader","fragment-shader");
    gl.useProgram(program);

    // a buffer for the vertexes
    this.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition,2,gl.FLOAT, false,0,0);
    gl.enableVertexAttribArray(vPosition);

    // a buffer for the colors
    this.cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.cBuffer);

    colorAttribute = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(colorAttribute,3,gl.FLOAT, false,0,0);
    gl.enableVertexAttribArray(colorAttribute);

    // end new stuff

    this.maxDepth = 1;
    this.Init();

    return this;
}

Canvas.prototype = {

    Init: function() {

        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
	this.RestartList();
    },

    RestartList: function() {
        this.currentDepth  = 1;

        var p1 = vec2(-0.8, -0.8);
        var p2 = vec2(0, .8);
        var p3 = vec2(0.8, -0.8);

	this.vertex= [p1, p2, p3] ;

	var c1 = vec3(Math.random(), Math.random(),Math.random())
	var c2 = vec3(Math.random(), Math.random(),Math.random())
	var c3 = vec3(Math.random(), Math.random(),Math.random())

	this.colors = [c1, c2, c3];

	this.MakePoints();

        this.UpdateBuffers();
        this.Redisplay();
    },

    UpdateBuffers: function() {
        gl = this.gl;
        // change the vertex data
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,flatten(this.vertex),gl.DYNAMIC_DRAW);

	// change the color data
        gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,flatten(this.colors),gl.DYNAMIC_DRAW);
    },

    GetDepth: function() {
       return this.maxDepth;
    },

    ChangeDepth: function(newDepth) {
        var depth = parseInt(newDepth);

	if (depth < 1 ) {
	   alert("depth must be positive");
	   return;
	} 

	if (depth  > 10) {
	   alert ("Depth has a max value of 10");
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

    Interp: function(a,b,s) {
        return a*(1-s) + b*s;
    },

    HalfPoint: function(p1,p2) {
	var x = this.Interp(p1[0],p2[0],.5);
	var y = this.Interp(p1[1],p2[1],.5);
	return vec2(x,y);
    },

    AddTri: function(p1, p2, p3, vert, c1, colors) {
        vert.push(p1);
	colors.push(c1);

        vert.push(p2);
	var c2 = vec3(Math.random(), Math.random(),Math.random())
	colors.push(c2);

        vert.push(p3);
	var c3 = vec3(Math.random(), Math.random(),Math.random())
	colors.push(c3);
    },

    MakePoints: function(){
        var newVertex = [];
	var newColors = [];
	var a,b,c;
	var p1, p2, p3;

	if (this.currentDepth < this.maxDepth) {
	   this.currentDepth++;

	   for(i =0; i < this.vertex.length;i+=3) {
	       a = this.vertex[i];
	       b = this.vertex[i+1]
	       c = this.vertex[i+2];

	       p1 = this.HalfPoint(a,b,.5);
	       p2 = this.HalfPoint(a,c,.5);
	       p3 = this.HalfPoint(b,c,.5);

               this.AddTri(a,p1,p2, newVertex, this.colors[i], newColors);
               this.AddTri(b,p1,p3, newVertex, this.colors[i+1], newColors);
               this.AddTri(c,p2,p3, newVertex, this.colors[i+2], newColors);
	    }
	    this.vertex = newVertex;
	    this.colors = newColors;

	    this.MakePoints();
	}
    },

    Redisplay: function() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertex.length);
        return;
    }
};