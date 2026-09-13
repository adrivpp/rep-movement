type CompletionVariant = {
  sku: string;
  price: string | number;
  stock: string | number;
};

type CompletionSpecs = Record<string, string>;

export type ProductCompletionInput = {
  title: string;
  vendor: string;
  productType: string;
  handle: string;
  shortDescription: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  specs: CompletionSpecs;
  colors: string[];
  sizes: string[];
  variants: CompletionVariant[];
};

export function getProductCompletion(input: ProductCompletionInput) {
  const uniqueSkus = new Set(
    input.variants
      .map((variant) => String(variant.sku).trim().toLowerCase())
      .filter(Boolean),
  );
  const checks = [
    ["Product name", Boolean(input.title.trim())],
    ["Vendor", Boolean(input.vendor.trim())],
    ["Product type", Boolean(input.productType.trim())],
    ["Handle", Boolean(input.handle.trim())],
    ["Short description", Boolean(input.shortDescription.trim())],
    ["Description", Boolean(input.description.trim())],
    ["SEO title", Boolean(input.seoTitle.trim())],
    ["SEO description", Boolean(input.seoDescription.trim())],
    ...Object.entries(input.specs).map(
      ([field, value]) => [field, Boolean(value.trim())] as const,
    ),
    ["At least one color", input.colors.length > 0],
    ["At least one size", input.sizes.length > 0],
    ["Variants", input.variants.length > 0],
    [
      "Variant prices",
      input.variants.length > 0 &&
        input.variants.every(
          (variant) =>
            Number(variant.price) >= 0 &&
            Number.isFinite(Number(variant.price)),
        ),
    ],
    [
      "Variant stock",
      input.variants.length > 0 &&
        input.variants.every(
          (variant) =>
            Number.isInteger(Number(variant.stock)) &&
            Number(variant.stock) >= 0,
        ),
    ],
    ["Unique SKUs", uniqueSkus.size === input.variants.length],
  ] as const;

  const missing = checks
    .filter(([, complete]) => !complete)
    .map(([label]) => label);
  return {
    percentage: Math.round(
      ((checks.length - missing.length) / checks.length) * 100,
    ),
    missing,
  };
}
