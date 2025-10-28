import { useRef, useEffect } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { useFBX, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

// Extend the FBXLoader into the THREE namespace
extend({ FBXLoader });

const FBXModel = ({ file }: { file: string }) => {
	const group = useRef<THREE.Group>(null);
	const fbx = useFBX(file);
	const { actions, mixer } = useAnimations(fbx.animations, group);

	useEffect(() => {
		if (actions && fbx.animations.length > 0) {
			mixer.stopAllAction();
			const action = actions[fbx.animations[0].name];
			if (action) {
				action.reset().fadeIn(0.5).play();
				action.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY); // Set the animation to loop indefinitely
			}
		} else {
			throw new Error("No animations found in the FBX file");
		}
	}, [actions, fbx.animations, mixer]);

	useFrame((state) => mixer.update(state.clock.getDelta()));

	return (
		<group ref={group}>
			<primitive object={fbx} scale={3} />{" "}
		</group>
	);
};

export default FBXModel;
