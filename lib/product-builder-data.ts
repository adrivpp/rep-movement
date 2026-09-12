import { normalizeSku } from "@/lib/utils";

export type Variant = {
  id: string;
  color: string;
  size: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  cost: string;
  stock: string;
  weight: string;
  barcode: string;
};

export type ProductImage = {
  id: string;
  url: string;
  name: string;
  alt: string;
};

export type ProductFormState = {
  title: string;
  vendor: string;
  productType: string;
  handle: string;
  shortDescription: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  colors: string[];
  sizes: string[];
  skuPrefix: string;
  tags: string[];
  metafields: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
  }>;
};

export type ProductBuilderInitialData = {
  id?: string;
  product: ProductFormState;
  variants: Variant[];
  images: ProductImage[];
};

export const blankProductState: ProductFormState = {
  title: "",
  vendor: "",
  productType: "",
  handle: "",
  shortDescription: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
  colors: [],
  sizes: [],
  skuPrefix: "",
  tags: [],
  metafields: []
};

export function generateVariants(colors: string[], sizes: string[], prefix: string): Variant[] {
  return colors.flatMap((color) =>
    sizes.map((size) => ({
      id: `${color}-${size}`,
      color,
      size,
      sku: `${normalizeSku(prefix)}-${normalizeSku(color)}-${normalizeSku(size)}`,
      price: "",
      compareAtPrice: "",
      cost: "",
      stock: "0",
      weight: "",
      barcode: ""
    }))
  );
}

export const demoBuilderData: ProductBuilderInitialData = {
  id: "contour-legging",
  product: {
    title: "Contour Legging",
    vendor: "REP",
    productType: "Leggings",
    handle: "contour-legging",
    shortDescription: "High-waisted contour leggings designed for studio days and slow mornings.",
    description:
      "A sculpting, soft-touch legging with a second-skin feel, subtle compression, and a clean high-rise waistband.",
    seoTitle: "Contour Legging | REP",
    seoDescription: "High-waisted contour leggings designed for studio days, training sessions, and daily movement.",
    colors: ["Oat", "Black"],
    sizes: ["XS", "S", "M", "L", "XL"],
    skuPrefix: "REP-CL",
    tags: ["activewear", "leggings", "oat", "studio"],
    metafields: [
      {
        namespace: "custom",
        key: "fabric",
        value: "Soft performance jersey",
        type: "single_line_text_field"
      }
    ]
  },
  variants: generateVariants(["Oat", "Black"], ["XS", "S", "M", "L", "XL"], "REP-CL").map(
    (variant) => ({
      ...variant,
      price: "89",
      compareAtPrice: "109",
      cost: "32",
      stock: "20",
      weight: "0.4"
    })
  ),
  images: []
};
