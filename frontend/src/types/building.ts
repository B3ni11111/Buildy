export interface Building {
  id: string;
  name: string;
  address: string;
}

export interface Issue {
  id: string;
  buildingId: string;
  authorId: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}
