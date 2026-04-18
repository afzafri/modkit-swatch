export type Paint = {
  brand: string;
  code: string;
  name: string;
  hex: string;
  finish: string;
  type: string;
  suitableFor: {
    airbrush: boolean;
    handPainting: boolean;
  };
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

export type Marker = {
  id: number;
  x: number;
  y: number;
  hex: string;
  assignedPaint: PaintMatch | null;
  labelX?: number;
  labelY?: number;
};

export type MixIngredient = {
  brand: string;
  code: string;
  name: string;
  hex: string;
  parts: number;
};

export type MixRecipe = {
  id: string;
  createdAt: number;
  targetHex: string | null;
  ingredients: MixIngredient[];
  mixedHex: string;
};
