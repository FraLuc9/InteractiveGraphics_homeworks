// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
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
	var mv = trans;
	return mv;
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
		this.normalBuffer = gl.createBuffer();

		this.posLocation = gl.getAttribLocation(this.program, 'aPosition');
		this.texLocation = gl.getAttribLocation(this.program, 'aTexCoord');
		this.normLocation = gl.getAttribLocation(this.program, 'aNormal');

		this.mv = gl.getUniformLocation(this.program, 'uMV');
		this.mvp = gl.getUniformLocation(this.program, 'uMVP');
		this.normal = gl.getUniformLocation(this.program, 'uNormal');
		this.swap = gl.getUniformLocation(this.program, 'uSwapYZ');
		this.show = gl.getUniformLocation(this.program, 'uShowTexture');
		this.sampler = gl.getUniformLocation(this.program, 'uTex');
		this.texture = gl.createTexture();
		this.lightDir = gl.getUniformLocation(this.program, 'uLightDir');
		this.alpha = gl.getUniformLocation(this.program, 'uAlpha');

		this.numTriangles = 0;

	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		this.numTriangles = vertPos.length / 3;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
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
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram(this.program);
		gl.uniformMatrix4fv(this.mv, false, matrixMV);
		gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
		gl.uniformMatrix3fv(this.normal, false, matrixNormal);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(this.posLocation, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.posLocation);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.vertexAttribPointer(this.texLocation, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.texLocation);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.vertexAttribPointer(this.normLocation, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.normLocation);

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

		gl.uniform1i(this.sampler, 0);
		this.showTexture(true);
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
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram(this.program);
		var norm = Math.sqrt(x * x + y * y + z * z);
		gl.uniform3f(this.lightDir, x / norm, y / norm, z / norm);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.program);
		gl.uniform1f(this.alpha, shininess);
	}
}

const vertexShader = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;
attribute vec3 aNormal;

uniform bool uSwapYZ;
uniform mat4 uMV;
uniform mat4 uMVP;
uniform mat3 uNormal;

varying vec2 vTexCoord;
varying vec3 vNormal;
varying vec4 vView;

void main() {
	vec3 pos = aPosition;

	if (uSwapYZ) {
		pos = vec3(pos.x, pos.z, pos.y);
	}
	
	vNormal = uNormal * aNormal;
	vView = uMV * vec4(pos, 1.0);
	gl_Position = uMVP * vec4(pos, 1.0);
	vTexCoord = aTexCoord;
	}
`;

const fragmentShader = `
precision mediump float;

uniform bool uShowTexture;
uniform float uAlpha;
uniform vec3 uLightDir;
uniform sampler2D uTex;

varying vec2 vTexCoord;
varying vec3 vNormal;
varying vec4 vView;

void main() {
	vec3 normal = normalize(vNormal);
	vec3 lightDir = normalize(uLightDir);
	vec3 viewDir = normalize(-vView.xyz);

	vec3 h = normalize(lightDir + viewDir);

	vec3 Kd = vec3(1.0);
	vec3 Ks = vec3(1.0);
	vec3 lightIntensity = vec3(1.0);

	float cosTheta = max(dot(normal, lightDir), 0.0);
	float cosPhi = max(dot(normal, h), 0.0);

	vec4 texColor; 
	if (uShowTexture) {
		texColor = texture2D(uTex, vTexCoord);
	} else {
		texColor = vec4(1.0, 1.0, 1.0, 1.0);
	}
	
	Kd = texColor.rgb;
	vec3 blinnModel = lightIntensity * (cosTheta * Kd + Ks * pow(cosPhi, uAlpha));
	gl_FragColor = vec4(blinnModel, texColor.a);
}
`;



// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep(dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution) {
    const numParticles = positions.length;

    const forces = new Array(numParticles);
    for (let i = 0; i < numParticles; i++) {
    	forces[i] = new Vec3(0, 0, 0);
	}

    for (const spring of springs) {
		// [TO-DO] Compute the total force of each particle
        const i = spring.p0;
        const j = spring.p1;

        const xi = positions[i];
        const xj = positions[j];

        const vi = velocities[i];
        const vj = velocities[j];

        const xij = xj.sub(xi);
        const vij = vj.sub(vi);
 
        const EPS = 1e-8;
		const length = xij.len();
		const direction = (length > EPS) ? xij.div(length) : new Vec3(0, 0, 0);

        const springForce = direction.mul(stiffness * (length - spring.rest));
		const dampingForce = direction.mul(damping * vij.dot(direction));
		const totalForce = springForce.add(dampingForce);

		forces[i].inc(totalForce);
		forces[j].dec(totalForce);

    }

    for (let i = 0; i < numParticles; i++) {
		// [TO-DO] Update positions and velocities
        const accel = forces[i].div(particleMass).add(gravity);

        velocities[i].inc(accel.mul(dt));

        positions[i].inc(velocities[i].copy().mul(dt));
    }

    for (let i = 0; i < numParticles; i++) {
		// [TO-DO] Handle collisions
        for (const axis of ['x', 'y', 'z']) {
            if (positions[i][axis] < -1.0) {
                positions[i][axis] = -1.0;
                if (velocities[i][axis] < 0) {
                    velocities[i][axis] *= -restitution;
                }
            } else if (positions[i][axis] > 1.0) {
                positions[i][axis] = 1.0;
                if (velocities[i][axis] > 0) {
                    velocities[i][axis] *= -restitution;
                }
            }
        }
    }
}

