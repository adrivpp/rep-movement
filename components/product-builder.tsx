"use client";

import { ChangeEvent, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Download,
  GripVertical,
  ImagePlus,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveProductDraft } from "@/app/(app)/products/actions";
import {
  blankProductState,
  generateVariants,
  type ProductBuilderInitialData,
  type ProductFormState,
  type ProductImage,
  type Variant,
} from "@/lib/product-builder-data";
import { cn, makeHandle, normalizeSku } from "@/lib/utils";

const steps = ["BASICS", "VARIANTS", "INVENTORY", "IMAGES", "SEO", "REVIEW"];

export function ProductBuilder({
  initialData,
  mode = "new",
}: {
  initialData?: ProductBuilderInitialData;
  mode?: "new" | "edit";
}) {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [product, setProduct] = useState<ProductFormState>(
    initialData?.product ?? blankProductState,
  );
  const [images, setImages] = useState<ProductImage[]>(
    initialData?.images ?? [],
  );
  const [variants, setVariants] = useState<Variant[]>(
    () => initialData?.variants ?? [],
  );
  const [newColor, setNewColor] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newTag, setNewTag] = useState("");
  const [saved, setSaved] = useState("Saved locally");
  const hasRequiredTitle = product.title.trim().length > 0;

  const completion = useMemo(() => {
    const checks = [
      product.title,
      product.vendor,
      product.productType,
      product.handle,
      product.shortDescription,
      product.description,
      product.seoTitle,
      product.seoDescription,
      product.colors.length,
      product.sizes.length,
      variants.length,
      variants.length > 0 &&
        variants.every((variant) => Number(variant.price) > 0),
      variants.length > 0 &&
        variants.every(
          (variant) =>
            variant.stock !== "" &&
            Number.isInteger(Number(variant.stock)) &&
            Number(variant.stock) >= 0,
        ),
      images.length,
      product.tags.length,
      product.metafields.length,
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [images.length, product, variants]);

  const primaryImage = images[0]?.url ?? null;
  const pageLabel =
    mode === "edit" && initialData?.id
      ? `EDIT PRODUCT / ${initialData.id}`
      : "NEW PRODUCT";

  function updateField(field: keyof typeof product, value: string) {
    setProduct((current) => ({
      ...current,
      [field]: value,
      ...(field === "title"
        ? {
            handle: makeHandle(value),
            seoTitle: `${value} | ${current.vendor || "Brand"}`,
          }
        : {}),
    }));
    markSaved();
  }

  function markSaved() {
    setSaved("Draft changes saved locally");
  }

  function addColor() {
    if (!newColor.trim()) return;
    const colors = [...product.colors, newColor.trim()];
    setProduct((current) => ({ ...current, colors }));
    setVariants(generateVariants(colors, product.sizes, product.skuPrefix));
    setNewColor("");
  }

  function addSize() {
    if (!newSize.trim()) return;
    const sizes = [...product.sizes, newSize.trim().toUpperCase()];
    setProduct((current) => ({ ...current, sizes }));
    setVariants(generateVariants(product.colors, sizes, product.skuPrefix));
    setNewSize("");
  }

  function regenerateSkus() {
    setVariants((current) =>
      current.map((variant) => ({
        ...variant,
        sku: `${normalizeSku(product.skuPrefix)}-${normalizeSku(variant.color)}-${normalizeSku(variant.size)}`,
      })),
    );
  }

  function updateVariant(id: string, field: keyof Variant, value: string) {
    setVariants((current) =>
      current.map((variant) =>
        variant.id === id ? { ...variant, [field]: value } : variant,
      ),
    );
  }

  function handleImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    );

    const previews = files.map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      name: file.name,
      alt: product.title,
    }));

    setImages((current) => [...current, ...previews]);
  }

  function exportCsv() {
    const rows = [
      [
        "Handle",
        "Title",
        "Body (HTML)",
        "Vendor",
        "Type",
        "Tags",
        "Option1 Name",
        "Option1 Value",
        "Option2 Name",
        "Option2 Value",
        "Variant SKU",
        "Variant Price",
        "Variant Compare At Price",
        "Variant Inventory Qty",
        "Variant Grams",
        "Image Src",
        "Image Alt Text",
        "SEO Title",
        "SEO Description",
      ],
      ...variants.map((variant, index) => [
        product.handle,
        product.title,
        product.description,
        product.vendor,
        product.productType,
        product.tags.join(", "),
        "Color",
        variant.color,
        "Size",
        variant.size,
        variant.sku,
        variant.price,
        variant.compareAtPrice,
        variant.stock,
        String(Math.round(Number(variant.weight || 0) * 1000)),
        index === 0 ? (images[0]?.url ?? "") : "",
        index === 0 ? (images[0]?.alt ?? product.title) : "",
        product.seoTitle,
        product.seoDescription,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${product.handle || "product"}-shopify.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function persistProduct(status: "in_progress" | "submitted" = "in_progress") {
    if (!hasRequiredTitle) {
      setSaved("Product name is required before saving.");
      setStep(0);
      return;
    }

    setSaved(status === "submitted" ? "Submitting..." : "Saving...");
    startTransition(async () => {
      const result = await saveProductDraft({
        productId: initialData?.id,
        product,
        variants,
        images: images.map((image) => ({ url: image.url, alt: image.alt })),
        completion,
        status,
      });

      setSaved(result.message);
    });
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 border-b border-[#ded6ca] bg-[#f7f3ec]/92 px-5 py-4 backdrop-blur lg:top-0 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="micro-label">{pageLabel}</p>
            <h1 className="mt-2 text-4xl font-medium sm:text-6xl">
              {product.title || "Untitled product"}
            </h1>
          </div>
          <div className="min-w-64">
            <div className="flex items-center justify-between text-xs font-semibold tracking-[0.12em] text-[#746d64]">
              <span>{completion}% COMPLETE</span>
              <span>{saved}</span>
            </div>
            <div className="mt-3 h-1 bg-[#e1d9cd]">
              <div
                className="h-full bg-[#241f1a] transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        </div>
        <nav className="mx-auto mt-6 flex max-w-7xl gap-5 overflow-x-auto pb-1">
          {steps.map((label, index) => (
            <button
              key={label}
              onClick={() => setStep(index)}
              className={`shrink-0 border-b py-2 text-xs font-semibold tracking-[0.15em] transition ${
                index === step
                  ? "border-[#241f1a] text-[#241f1a]"
                  : "border-transparent text-[#8a8176]"
              }`}
            >
              {String(index + 1).padStart(2, "0")} {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-12">
        <section className="min-w-0">
          {step === 0 && (
            <BuilderSection title="Basic Information">
              <div className="grid gap-8 md:grid-cols-2">
                <TextField
                  label="PRODUCT NAME"
                  value={product.title}
                  required
                  onChange={(value) => updateField("title", value)}
                />
                <TextField
                  label="BRAND"
                  value={product.vendor}
                  onChange={(value) => updateField("vendor", value)}
                />
                <TextField
                  label="PRODUCT TYPE"
                  value={product.productType}
                  onChange={(value) => updateField("productType", value)}
                />
                <TextField
                  label="URL HANDLE"
                  value={product.handle}
                  onChange={(value) => updateField("handle", makeHandle(value))}
                />
              </div>
              <TextArea
                label="DESCRIPTION"
                value={product.description}
                onChange={(value) => updateField("description", value)}
              />
              <TextArea
                label="SHORT DESCRIPTION"
                value={product.shortDescription}
                onChange={(value) => updateField("shortDescription", value)}
              />
            </BuilderSection>
          )}

          {step === 1 && (
            <BuilderSection title="Variants">
              <ChipEditor
                label="COLOR"
                values={product.colors}
                inputValue={newColor}
                setInputValue={setNewColor}
                onAdd={addColor}
              />
              <ChipEditor
                label="SIZES"
                values={product.sizes}
                inputValue={newSize}
                setInputValue={setNewSize}
                onAdd={addSize}
              />
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <TextField
                  label="SKU PREFIX"
                  value={product.skuPrefix}
                  onChange={(value) =>
                    setProduct((current) => ({
                      ...current,
                      skuPrefix: normalizeSku(value),
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={regenerateSkus}
                >
                  GENERATE SKUS
                </Button>
              </div>
              <VariantRows
                variants={variants}
                onChange={updateVariant}
                compact
              />
            </BuilderSection>
          )}

          {step === 2 && (
            <BuilderSection title="Pricing & Inventory">
              <BulkTools
                onApply={(field, value) =>
                  setVariants((current) =>
                    current.map((variant) => ({ ...variant, [field]: value })),
                  )
                }
              />
              <VariantRows variants={variants} onChange={updateVariant} />
            </BuilderSection>
          )}

          {step === 3 && (
            <BuilderSection title="Product Imagery">
              <label className="flex min-h-72 cursor-pointer flex-col items-center justify-center border border-dashed border-[#cfc5b7] bg-[#fffdf8]/54 p-8 text-center transition hover:bg-[#eee7db]">
                <ImagePlus className="h-9 w-9 text-[#746d64]" />
                <span className="micro-label mt-5">PRODUCT IMAGERY</span>
                <span className="mt-3 text-2xl font-medium">
                  Drag and drop your images here
                </span>
                <span className="mt-2 text-sm text-[#746d64]">
                  JPG, PNG, or WEBP
                </span>
                <input
                  className="sr-only"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImages}
                />
              </label>
              <div className="grid gap-5 md:grid-cols-3">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className={index === 0 ? "md:col-span-2 md:row-span-2" : ""}
                  >
                    <div className="group relative overflow-hidden rounded-md bg-[#e5ddd2]">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        width={700}
                        height={900}
                        className="aspect-[4/5] h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        unoptimized
                      />
                      <div className="absolute left-3 top-3 flex gap-2">
                        <span className="rounded-full bg-[#fffaf2]/90 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.13em]">
                          {index === 0 ? "PRIMARY" : `IMAGE ${index + 1}`}
                        </span>
                        <GripVertical className="h-6 w-6 rounded-full bg-[#fffaf2]/90 p-1 text-[#62594f]" />
                      </div>
                      <button
                        className="absolute right-3 top-3 rounded-full bg-[#fffaf2]/90 p-2 text-[#62594f]"
                        onClick={() =>
                          setImages((current) =>
                            current.filter((item) => item.id !== image.id),
                          )
                        }
                        aria-label="Delete image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      className="field mt-3 text-sm"
                      value={image.alt}
                      onChange={(event) =>
                        setImages((current) =>
                          current.map((item) =>
                            item.id === image.id
                              ? { ...item, alt: event.target.value }
                              : item,
                          ),
                        )
                      }
                      aria-label="Image alt text"
                    />
                    {index !== 0 && (
                      <button
                        className="mt-2 text-xs font-semibold tracking-[0.13em] text-[#62594f]"
                        onClick={() =>
                          setImages((current) => [
                            image,
                            ...current.filter((item) => item.id !== image.id),
                          ])
                        }
                      >
                        SET PRIMARY
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </BuilderSection>
          )}

          {step === 4 && (
            <BuilderSection title="SEO">
              <TextField
                label={`SEO TITLE ${product.seoTitle.length}/70`}
                value={product.seoTitle}
                onChange={(value) => updateField("seoTitle", value)}
              />
              <TextArea
                label={`SEO DESCRIPTION ${product.seoDescription.length}/160`}
                value={product.seoDescription}
                onChange={(value) => updateField("seoDescription", value)}
              />
              <TextField
                label="URL HANDLE"
                value={product.handle}
                onChange={(value) => updateField("handle", makeHandle(value))}
              />
              <div className="soft-card p-6">
                <p className="text-[#1a0dab]">{product.seoTitle}</p>
                <p className="mt-1 text-sm text-[#006621]">
                  your-store.com/products/{product.handle}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#62594f]">
                  {product.seoDescription}
                </p>
              </div>
            </BuilderSection>
          )}

          {step === 5 && (
            <BuilderSection title="Review & Submit">
              <ChipEditor
                label="TAGS"
                values={product.tags}
                inputValue={newTag}
                setInputValue={setNewTag}
                onAdd={() => {
                  if (!newTag.trim()) return;
                  setProduct((current) => ({
                    ...current,
                    tags: [...current.tags, newTag.trim()],
                  }));
                  setNewTag("");
                }}
              />
              <div className="space-y-5">
                <p className="micro-label">METAFIELDS</p>
                {product.metafields.map((field, index) => (
                  <div
                    key={`${field.namespace}-${field.key}`}
                    className="grid gap-4 md:grid-cols-4"
                  >
                    {(["namespace", "key", "value", "type"] as const).map(
                      (property) => (
                        <input
                          key={property}
                          className="field"
                          value={field[property]}
                          onChange={(event) =>
                            setProduct((current) => ({
                              ...current,
                              metafields: current.metafields.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        [property]: event.target.value,
                                      }
                                    : item,
                              ),
                            }))
                          }
                          aria-label={property}
                        />
                      ),
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setProduct((current) => ({
                      ...current,
                      metafields: [
                        ...current.metafields,
                        {
                          namespace: "custom",
                          key: "",
                          value: "",
                          type: "single_line_text_field",
                        },
                      ],
                    }))
                  }
                >
                  <Plus className="h-4 w-4" /> ADD METAFIELD
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Button type="button" variant="secondary" onClick={exportCsv}>
                  <Download className="h-4 w-4" /> EXPORT SHOPIFY CSV
                </Button>
                <Button
                  type="button"
                  disabled={isPending || !hasRequiredTitle}
                  onClick={() => persistProduct("submitted")}
                >
                  SUBMIT FOR REVIEW <Check className="h-4 w-4" />
                </Button>
              </div>
            </BuilderSection>
          )}

          <div className="sticky bottom-0 -mx-5 mt-12 border-t border-[#ded6ca] bg-[#f7f3ec]/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:hidden">
            <div className="flex gap-3">
              <Button
                className="flex-1"
                variant="secondary"
                type="button"
                disabled={isPending || !hasRequiredTitle}
                onClick={() => persistProduct()}
              >
                SAVE DRAFT
              </Button>
              <Button
                className="flex-1"
                type="button"
                onClick={() => setStep(Math.min(step + 1, steps.length - 1))}
              >
                CONTINUE <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-40">
            <ProductPreview
              product={product}
              variants={variants}
              primaryImage={primaryImage}
              completion={completion}
            />
            <div className="mt-6 flex gap-3">
              <Button
                className="flex-1"
                variant="secondary"
                type="button"
                disabled={isPending || !hasRequiredTitle}
                onClick={() => persistProduct()}
              >
                SAVE DRAFT
              </Button>
              <Button
                className="flex-1"
                type="button"
                onClick={() => setStep(Math.min(step + 1, steps.length - 1))}
              >
                CONTINUE <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function BuilderSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-10">
      <div className="flex items-center gap-5">
        <p className="micro-label">{title}</p>
        <div className="h-px flex-1 bg-[#ded6ca]" />
      </div>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  required = false,
  onChange,
}: {
  label: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="micro-label">{label}</span>
      <input
        className="field mt-2"
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
      {required && !value.trim() && (
        <span className="mt-2 block text-xs text-[#7a4d27]">
          Required before saving
        </span>
      )}
    </label>
  );
}

function TextArea({
  label,
  value,
  rows = 4,
  onChange,
}: {
  label: string;
  value: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="micro-label">{label}</span>
      <textarea
        className="field mt-2 resize-y"
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ChipEditor({
  label,
  values,
  inputValue,
  setInputValue,
  onAdd,
}: {
  label: string;
  values: string[];
  inputValue: string;
  setInputValue: (value: string) => void;
  onAdd: () => void;
}) {
  return (
    <div>
      <p className="micro-label">{label}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {values.map((value) => (
          <span
            key={value}
            className="rounded-full border border-[#d8d0c5] px-4 py-2 text-sm"
          >
            {value}
          </span>
        ))}
        <input
          className="min-w-28 border-b border-[#d8d0c5] bg-transparent px-1 py-2 text-sm outline-none"
          placeholder="+ Add"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAdd();
            }
          }}
        />
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add ${label.toLowerCase()}`}
          className="rounded-full border border-[#d8d0c5] p-2"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function BulkTools({
  onApply,
}: {
  onApply: (field: "price" | "stock" | "weight", value: string) => void;
}) {
  const [field, setField] = useState<"price" | "stock" | "weight">("price");
  const [value, setValue] = useState("");

  return (
    <div className="grid gap-4 border-y border-[#ded6ca] py-6 sm:grid-cols-[180px_1fr_auto] sm:items-end">
      <label>
        <span className="micro-label">BULK FIELD</span>
        <select
          className="field mt-2"
          value={field}
          onChange={(event) =>
            setField(event.target.value as "price" | "stock" | "weight")
          }
        >
          <option value="price">Price</option>
          <option value="stock">Stock</option>
          <option value="weight">Weight</option>
        </select>
      </label>
      <TextField label="VALUE" value={value} onChange={setValue} />
      <Button
        type="button"
        variant="secondary"
        onClick={() => onApply(field, value)}
      >
        APPLY
      </Button>
    </div>
  );
}

function VariantRows({
  variants,
  onChange,
  compact = false,
}: {
  variants: Variant[];
  compact?: boolean;
  onChange: (id: string, field: keyof Variant, value: string) => void;
}) {
  if (variants.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-[#746d64] border-y border-[#ded6ca]">
        No variants generated yet. Add colors and sizes above.
      </div>
    );
  }

  return (
    <div className={compact ? "" : "overflow-x-auto pb-2"}>
      <div
        className={
          compact
            ? "divide-y divide-[#ded6ca] border-y border-[#ded6ca]"
            : "min-w-[960px] divide-y divide-[#ded6ca] border-y border-[#ded6ca]"
        }
      >
        {variants.map((variant) => (
          <div
            key={variant.id}
            className={
              compact
                ? "grid gap-4 py-5 sm:grid-cols-[200px_1fr] sm:items-end"
                : "grid gap-4 py-5 grid-cols-[160px_1.8fr_0.85fr_0.85fr_0.75fr_0.75fr_1.1fr] items-end"
            }
          >
            <div className="min-w-0">
              <p className="text-xl font-medium truncate">
                {variant.color} / {variant.size}
              </p>
              <p className="mt-1 text-sm text-[#746d64] truncate">
                {variant.sku}
              </p>
            </div>
            <InlineInput
              label="SKU"
              value={variant.sku}
              className="min-w-[180px]"
              onChange={(value) => onChange(variant.id, "sku", value)}
            />
            {!compact && (
              <>
                <InlineInput
                  label="PRICE"
                  type="number"
                  value={variant.price}
                  onChange={(value) => onChange(variant.id, "price", value)}
                />
                <InlineInput
                  label="COMPARE"
                  type="number"
                  value={variant.compareAtPrice}
                  onChange={(value) =>
                    onChange(variant.id, "compareAtPrice", value)
                  }
                />
                <InlineInput
                  label="STOCK"
                  type="number"
                  value={variant.stock}
                  onChange={(value) => onChange(variant.id, "stock", value)}
                />
                <InlineInput
                  label="WEIGHT"
                  type="number"
                  value={variant.weight}
                  onChange={(value) => onChange(variant.id, "weight", value)}
                />
                <InlineInput
                  label="BARCODE"
                  value={variant.barcode}
                  onChange={(value) => onChange(variant.id, "barcode", value)}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function InlineInput({
  label,
  value,
  type = "text",
  className,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  className?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="micro-label">{label}</span>
      <input
        className="field mt-1 py-2 text-sm w-full"
        type={type}
        value={value}
        min={type === "number" ? "0" : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ProductPreview({
  product,
  variants,
  primaryImage,
  completion,
}: {
  product: ProductFormState;
  variants: Variant[];
  primaryImage: string | null;
  completion: number;
}) {
  const colors = Array.from(new Set(variants.map((variant) => variant.color)));
  const sizes = Array.from(new Set(variants.map((variant) => variant.size)));
  const price = variants[0]?.price ?? "0";

  return (
    <div className="border border-[#ded6ca] bg-[#fffdf8]/56 p-5">
      <div className="relative overflow-hidden rounded-md bg-[#e7dfd4]">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.title}
            width={700}
            height={900}
            className="aspect-[4/5] w-full object-cover"
            unoptimized={primaryImage.startsWith("blob:")}
          />
        ) : (
          <div className="flex aspect-[4/5] w-full flex-col items-center justify-center px-8 text-center text-[#746d64]">
            <ImagePlus className="h-8 w-8" />
            <p className="micro-label mt-4">NO IMAGE</p>
            <p className="mt-2 text-sm leading-6">
              Add product imagery to begin the preview.
            </p>
          </div>
        )}
      </div>
      <div className="mt-6">
        <p className="micro-label">{completion}% COMPLETE</p>
        <h2 className="mt-3 text-3xl font-medium">
          {product.title || "Untitled product"}
        </h2>
        <p className="mt-2 text-xl">{price ? `$${price}` : "Price not set"}</p>
        <p className="micro-label mt-8">COLOR</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {colors.map((color) => (
            <span
              key={color}
              className="border border-[#d8d0c5] px-3 py-2 text-sm"
            >
              {color}
            </span>
          ))}
        </div>
        <p className="micro-label mt-8">SIZE</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {sizes.map((size) => (
            <span
              key={size}
              className="border border-[#d8d0c5] px-3 py-2 text-sm"
            >
              {size}
            </span>
          ))}
        </div>
        <p className="micro-label mt-8">PRODUCT DETAILS</p>
        <p className="mt-3 text-sm leading-6 text-[#62594f]">
          {product.shortDescription}
        </p>
      </div>
    </div>
  );
}
