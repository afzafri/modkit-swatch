declare module "mixbox" {
  type LatentVector = number[];

  interface Mixbox {
    lerp(rgb1: string | [number, number, number], rgb2: string | [number, number, number], t: number): [number, number, number];
    rgbToLatent(rgb: string | [number, number, number]): LatentVector;
    latentToRgb(latent: LatentVector): [number, number, number];
  }

  const mixbox: Mixbox;
  export default mixbox;
}
