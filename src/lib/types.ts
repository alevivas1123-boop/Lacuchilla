export type ProductCategory = "quesos" | "dulces" | "otros";

/** Cómo se vende el producto: por kilo o por unidad. */
export type SaleUnit = "kg" | "unit";

export interface Product {
  /** Slug único. También es el nombre del archivo de imagen: /products/<slug>.webp */
  slug: string;
  name: string;
  category: ProductCategory;
  saleUnit: SaleUnit;
  /** Precio en pesos uruguayos, por kilo o por unidad según `saleUnit`. */
  price: number;
  /** Cómo se presenta el producto. Ej: "Venta por kilo", "Frasco de 380 g". */
  presentation: string;
  /** Ruta de la foto dentro de /public. Ej: "/products/queso-colonia.webp". */
  image: string;
  /** Texto alternativo descriptivo de la foto. */
  alt: string;
  /**
   * Cómo encaja la foto en el recuadro 4:3 de la tarjeta.
   * "cover" (por defecto) llena el recuadro; "contain" muestra la foto
   * entera sobre fondo crema, para las que quedarían mal recortadas.
   */
  imageFit?: "cover" | "contain";
  description: string;
  /** Opciones del selector. En kg: [1,2,3,4,5]. En unidad: no aplica. */
  weightOptions?: number[];
  /** Se completa en el servidor: true si existe la foto real en /public/products. */
  hasImage?: boolean;
}

export interface CartItem {
  /** Clave estable de la línea del carrito (por ahora, el slug). */
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  saleUnit: SaleUnit;
  presentation: string;
  /** Precio por kilo o por unidad. */
  unitPrice: number;
  /** Kilos (si saleUnit === "kg") o unidades (si saleUnit === "unit"). */
  quantity: number;
}

export interface OrderCustomer {
  fullName: string;
  phone: string;
  email?: string;
  fulfillment: "envio" | "retiro";
  address?: string;
  locality?: string;
  preferredTime?: string;
  notes?: string;
}

export interface Order {
  orderNumber: string;
  createdAt: string;
  items: CartItem[];
  total: number;
  customer: OrderCustomer;
}
