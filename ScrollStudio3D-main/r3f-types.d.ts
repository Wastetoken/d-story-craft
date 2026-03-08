import '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      primitive: any;
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      mesh: any;
      torusGeometry: any;
      octahedronGeometry: any;
      capsuleGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      bufferGeometry: any;
      lineBasicMaterial: any;
      cylinderGeometry: any;
      color: any;
      fogExp2: any;
      line_: any;
    }
  }
}
