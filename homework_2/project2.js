// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	let theta = rotation * (Math.PI / 180);

	return Array( 
		scale * Math.cos(theta), 
		scale * Math.sin(theta), 
		0,

	   -scale * Math.sin(theta), 
	    scale * Math.cos(theta), 
		0,

	    positionX, 
		positionY, 
		1 
	);
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2 )
{
	return Array( 
		trans1[0] * trans2[0] + trans1[3] * trans2[1],
        trans1[1] * trans2[0] + trans1[4] * trans2[1],
        0,

        trans1[0] * trans2[3] + trans1[3] * trans2[4],
        trans1[1] * trans2[3] + trans1[4] * trans2[4],
        0,

        trans2[0] * trans1[6] + trans2[3] * trans1[7] + trans2[6],
        trans2[1] * trans1[6] + trans2[4] * trans1[7] + trans2[7],
        1 
	);
}
