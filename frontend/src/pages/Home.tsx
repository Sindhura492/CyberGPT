import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { ModeToggle } from "../components/theme/mode-toggle";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import avatars from "../Avatardata/avatars.json";
import FBXModel from "../components/DisplayAvatar/FBXModel";
import ErrorBoundary from "../components/DisplayAvatar/ErrorBoundary";
import { Button } from "../components/ui/button";
import { useTheme } from "next-themes";

extend({ FBXLoader });

const AdaptiveGridHelper = () => {
	const { resolvedTheme } = useTheme();
	const { scene } = useThree();

	const gridHelper = useMemo(() => {
		const helper = new THREE.GridHelper(10, 10);
		helper.position.y = -0.3;

		const color = resolvedTheme === "dark" ? 0xffffff : 0x000000;
		const material = new THREE.LineBasicMaterial({
			color: color,
			transparent: true,
			opacity: resolvedTheme === "dark" ? 0.5 : 0.2,
		});

		helper.material = material;
		return helper;
	}, [resolvedTheme]);

	useEffect(() => {
		scene.add(gridHelper);
		return () => {
			scene.remove(gridHelper);
		};
	}, [scene, gridHelper]);

	return null;
};

const DiscoBorderFloor = () => {
	const shaderMaterial = useMemo(
		() =>
			new THREE.ShaderMaterial({
				uniforms: {
					time: { value: 0.0 },
				},
				vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
				fragmentShader: `
      uniform float time;
      varying vec2 vUv;
      void main() {
        vec3 color1 = vec3(0.443, 0.337, 0.859); // #7156DB
        vec3 color2 = vec3(0.153, 0.133, 0.471); // #272278
        vec3 color3 = vec3(0.059, 0.039, 0.145); // #0F0A25
        vec3 color4 = vec3(0.031, 0.004, 0.082); // #080115

        // Calculate gradient based on vUv and time
        float borderSize = 0.5; // Size of the border
        float edge = borderSize - min(min(vUv.x, vUv.y), min(1.0 - vUv.x, 1.0 - vUv.y));
        float pattern = sin(edge * 20.0 + time * 1.0);

        vec3 color = mix(color1, color2, pattern);
        color = mix(color, color3, pattern * 0.5);
        color = mix(color, color4, pattern * 0.25);

        // Mix the border color with a white background
        vec3 finalColor = mix(vec3(1.0), color, step(0.0, edge));

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
			}),
		[],
	);

	useFrame((state) => {
		shaderMaterial.uniforms.time.value = state.clock.getElapsedTime();
	});

	return (
		<mesh
			rotation={[-Math.PI / 2, 0, 0]}
			position={[0, -0.301, 0]}
			receiveShadow
		>
			<planeGeometry args={[10, 10]} />
			<primitive object={shaderMaterial} attach="material" />
		</mesh>
	);
};

export const Home = () => {
	const [currentAvatar, setCurrentAvatar] = useState(0);

	const handleNextAvatar = useCallback(() => {
		setCurrentAvatar((prev) => (prev + 1) % avatars.length);
	}, []);

	const handlePrevAvatar = useCallback(() => {
		setCurrentAvatar(
			(prev) => (prev - 1 + avatars.length) % avatars.length,
		);
	}, []);

	return (
		<div className="flex flex-col min-h-screen bg-transparent">
			<header className="p-4 flex justify-center items-center">
				<h1 className="text-4xl font-bold text-center">
					AI Security Assessment
				</h1>
				<div className="absolute right-4">
					<ModeToggle />
				</div>
			</header>

			<div className="flex-1 relative">
				<div className="flex-1 relative h-[calc(100vh-6rem)]">
					<ErrorBoundary>
						<Canvas
							camera={{
								position: [0, 3.5, 8.5],
								fov: 45,
								near: 0.1,
								far: 1000,
							}}
							className="w-full h-full"
							onCreated={({ gl, camera, scene }) => {
								gl.domElement.addEventListener(
									"webglcontextlost",
									(event) => {
										event.preventDefault();
										throw new Error("WebGL context lost");
									},
								);
								camera.lookAt(0, 1.8, 0);
								scene.background = null;
								gl.setClearColor(0x000000, 0);
							}}
						>
							<ambientLight intensity={1} />
							<directionalLight
								position={[10, 10, 5]}
								intensity={2}
							/>
							<pointLight position={[0, 10, 0]} intensity={2} />
							<Suspense fallback={null}>
								<group
									position={[0, -0.3, 0]}
									scale={[0.85, 0.85, 0.85]}
								>
									<FBXModel
										key={currentAvatar}
										file={avatars[currentAvatar].file}
									/>
								</group>
							</Suspense>
							<OrbitControls
								target={[0, 1.8, 0]}
								minPolarAngle={Math.PI / 4}
								maxPolarAngle={Math.PI / 1.8}
								enableZoom={false}
								enablePan={false}
								minDistance={6}
								maxDistance={10}
							/>
							<DiscoBorderFloor />
							<AdaptiveGridHelper />
						</Canvas>
					</ErrorBoundary>

					{/* <div className="absolute left-1/4 top-1/4 transform -translate-x-1/2 -translate-y-1/2 bg-card border-l border-b border-border shadow-lg rounded-lg p-4 w-64">
						<p className="text-center mb-4 font-bold">
							Already a member?
						</p>
						<Button
							variant="outline"
							className="w-full mb-2"
							asChild
						>
							<a href="/login">Login</a>
						</Button>
						<Button variant="outline" className="w-full" asChild>
							<a href="/register">Register</a>
						</Button>
					</div> */}

					{/* Message bubble for avatar name and role */}
					<div className="absolute left-[70%] top-[10%] transform -translate-x-1/2 -translate-y-1/2 bg-card border-1 border-b border-border shadow-lg rounded-lg p-4 w-64 flex flex-col items-center">
						<p className="text-center mb-4 font-bold text-lg">
							{avatars[currentAvatar].title}
						</p>
						<p className="text-center mb-4">
							{avatars[currentAvatar].role}
						</p>
						<Button variant="outline" className="w-full" asChild>
							<a href="/chatbot">
								Choose {avatars[currentAvatar].name}
							</a>
						</Button>
					</div>

					<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
						<Button
							variant="outline"
							size="icon"
							onClick={handlePrevAvatar}
						>
							←
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={handleNextAvatar}
						>
							→
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Home;
