// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{
	// mirroring the rotation
	rotationX = -rotationX;
	rotationY = -rotationY;

	var cx = Math.cos(rotationX);
	var sx = Math.sin(rotationX);
	var cy = Math.cos(rotationY);
	var sy = Math.sin(rotationY);
	
	// [TO-DO] Modify the code below to form the transformation matrix.
	var trans = [
		cy, 		  sx*sy, 		cx*sy, 		  0,
		0, 			  cx, 		    -sx, 		  0,
		-sy, 	      cy*sx, 	    cx*cy,        0,
		translationX, translationY, translationZ, 1
	];

	var mvp = MatrixMult( projectionMatrix, trans );
	return mvp;
}


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
		
		this.program = InitShaderProgram(vertexShader, fragmentShader);

		this.vertexBuffer = gl.createBuffer();
		this.texCoordBuffer = gl.createBuffer();

		this.posLocation = gl.getAttribLocation(this.program, 'aPosition');
		this.texLocation = gl.getAttribLocation(this.program, 'aTexCoord');

		this.matrix = gl.getUniformLocation(this.program, 'uMVP');
		this.swap = gl.getUniformLocation(this.program, 'uSwapYZ');
		this.show = gl.getUniformLocation(this.program, 'uShowTexture');
		this.sampler = gl.getUniformLocation(this.program, 'uTex');
		this.texture = gl.createTexture();

		this.numTriangles = 0;


	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		this.numTriangles = vertPos.length / 3;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		gl.useProgram(this.program);
		gl.uniform1i(this.swap, swap);
	}
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw( trans )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram(this.program);
		gl.uniformMatrix4fv(this.matrix, false, trans);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(this.posLocation, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.posLocation);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.vertexAttribPointer(this.texLocation, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.texLocation);
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [TO-DO] Bind the texture
		gl.useProgram(this.program);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.

		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		
		gl.uniform1i(this.sampler, 0);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		gl.useProgram(this.program);
		gl.uniform1i(this.show, show);
	}
	
}

const vertexShader = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform bool uSwapYZ;
uniform mat4 uMVP;

varying vec2 vTexCoord;

void main() {
	vec3 pos = aPosition;

	if (uSwapYZ) {
		pos = vec3(pos.x, pos.z, pos.y);
	}
	
	gl_Position = uMVP * vec4(pos, 1.0);
	vTexCoord = aTexCoord;
	}
`;

const fragmentShader = `
precision mediump float;
uniform bool uShowTexture;
uniform sampler2D uTex;

varying vec2 vTexCoord;
void main() {
	if (uShowTexture) {
		gl_FragColor = texture2D(uTex, vTexCoord);
	} else {
		gl_FragColor = vec4(1, gl_FragCoord.z * gl_FragCoord.z, 0, 1);
	}
}
`;
