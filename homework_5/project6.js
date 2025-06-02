var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0,0,0);
	for ( int i=0; i<NUM_LIGHTS; ++i ) {
		// TO-DO: Check for shadows
		vec3 lightDir = normalize(lights[i].position - position);
		Ray shadowRay;
		shadowRay.pos = position + lightDir * 0.001;
		shadowRay.dir = lightDir;

		HitInfo shadowHit;
		if (IntersectRay(shadowHit, shadowRay)) {
			color += mtl.k_d * 0.01;
		} else {
		 	// TO-DO: If not shadowed, perform shading using the Blinn model
			vec3 h = normalize(lightDir + view);
			float diff = max(dot(normal, lightDir), 0.0);
			float spec = pow(max(dot(normal, h), 0.0), mtl.n);
			color += lights[i].intensity * (mtl.k_d * diff + mtl.k_s * spec);
		}
	}
	return color;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	// normalizing once
	ray.dir = normalize(ray.dir);

	hit.t = 1e30;
	bool foundHit = false;
	for ( int i=0; i<NUM_SPHERES; ++i ) {
		// TO-DO: Test for ray-sphere intersection
		vec3 oc = ray.pos - spheres[i].center;
		float a = dot(ray.dir, ray.dir);
		float b = 2.0 * dot(ray.dir, oc);
		float c = dot(oc, oc) - spheres[i].radius * spheres[i].radius;
		float delta = b * b - 4.0 * a * c;

		// TO-DO: If intersection is found, update the given HitInfo
		if (delta >= 0.0) {
			float t = (-b - sqrt(delta)) / (2.0 * a);
			if (t >= 0.0 && t <= hit.t) {
				foundHit = true;
				hit.t = t;
				hit.position = ray.pos + t * ray.dir;
				hit.normal = normalize((hit.position - spheres[i].center) / spheres[i].radius);
				hit.mtl = spheres[i].mtl;
			}
		}
	}
	return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		// Compute reflections
		vec3 k_s = hit.mtl.k_s;
		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
			
			Ray r;	// this is the reflection ray
			HitInfo h;	// reflection hit info

			// TO-DO: Initialize the reflection ray
			r.pos = hit.position + 0.001 * hit.normal;
			r.dir = reflect(ray.dir, hit.normal);

			if ( IntersectRay( h, r ) ) {
				// TO-DO: Hit found, so shade the hit point
				vec3 viewDir = normalize(-r.dir);
				clr += k_s * Shade(h.mtl, h.position, h.normal, viewDir);

				// TO-DO: Update the loop variables for tracing the next reflection ray
				k_s *= h.mtl.k_s;
				hit = h;
				ray = r;
			} else {
				// The refleciton ray did not intersect with anything,
				// so we are using the environment color
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;	// no more reflections
			}
		}
		return vec4( clr, 1 );	// return the accumulated color, including the reflections
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
	}
}
`;
