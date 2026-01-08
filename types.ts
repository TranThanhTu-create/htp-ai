
export enum HouseType {
  Townhouse = 'Nhà phố',
  Villa = 'Biệt thự',
  GardenHouse = 'Nhà vườn',
  Level4 = 'Nhà cấp 4',
  Modern = 'Nhà hiện đại'
}

export enum DesignStyle {
  Modern = 'Hiện đại',
  Neoclassical = 'Tân cổ điển',
  Minimalist = 'Tối giản',
  Industrial = 'Công nghiệp',
  Scandinavian = 'Bắc Âu',
  Traditional = 'Truyền thống'
}

export interface DesignSuggestion {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  estimatedCost: string;
}

export interface DesignFormData {
  houseType: HouseType;
  style: DesignStyle;
  budget: string;
  image: string | null;
  landWidth: string;
  landLength: string;
  floors: string;
  frontYardLength: string;
  birthDate: string; // Thêm ngày sinh
}
