export type Paint = {
  brand: string;
  code: string;
  name: string;
  hex: string;
  finish: string;
  type: string;
};

export type PaintWithLab = Paint & {
  lab: { L: number; a: number; b: number };
};

export type PaintMatch = PaintWithLab & {
  deltaE: number;
};

export type Filters = {
  brand: string;
  finish: string;
  type: string;
};
