export interface IProductEditData {
  title: string;
  description: string;
  price: string;
  mainImage: string;
  newImages?: string;
  commentsToRemove?: string | string[];
  similarToAdd?: string | string[];
  similarToRemove?: string | string[]
  imagesToRemove: string | string[];
}