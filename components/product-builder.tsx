"use client";

import { ChangeEvent, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { ArrowRight, Check, Download, ImagePlus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveProductDraft } from "@/app/(app)/products/actions";
import {
  blankProductState,
  type ProductBuilderInitialData,
  type ColorwayDetails,
  type ProductFormState,
  type ProductImage,
  type ProductSpecs,
  type Variant,
} from "@/lib/product-builder-data";
import { mergeVariants } from "@/lib/product-builder-data";
import { getProductCompletion } from "@/lib/product-completion";
import { cn, makeHandle, normalizeSku } from "@/lib/utils";

const steps = [
  "BASICS",
  "VARIANTS",
  "INVENTORY",
  "DETAILS",
  //  "IMAGES",
  "SEO",
  "REVIEW",
];

const specFields: Array<[keyof ProductSpecs, string]> = [
  ["fabric", "FABRIC"],
  ["composition", "COMPOSITION"],
  ["fit", "FIT"],
  ["compression", "COMPRESSION"],
  ["stretch", "STRETCH"],
  ["support", "SUPPORT"],
  ["rise", "RISE"],
  ["length", "LENGTH"],
  ["activity", "ACTIVITY"],
  ["modelHeight", "MODEL HEIGHT"],
  ["modelSize", "MODEL SIZE"],
  ["careInstructions", "CARE INSTRUCTIONS"],
  ["countryOfOrigin", "COUNTRY OF ORIGIN"],
];

const defaultColorwayDetails = {
  status: "available" as const,
  isPermanent: true,
  isLimited: false,
  preorderEnabled: false,
  preorderStart: "",
  preorderEnd: "",
  preorderShippingEstimate: "",
  preorderMessage: "",
};

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
  const completionResult = useMemo(
    () =>
      getProductCompletion({
        ...product,
        variants,
      }),
    [product, variants],
  );
  const hasRequiredTitle = product.title.trim().length > 0;
  const isReadyToSubmit = completionResult.missing.length === 0;

  const completion = completionResult.percentage;

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
    const color = newColor.trim();
    if (
      product.colors.some(
        (value) => value.toLowerCase() === color.toLowerCase(),
      )
    )
      return;
    const colors = [...product.colors, color];
    setProduct((current) => ({
      ...current,
      colors,
      colorwayDetails: {
        ...current.colorwayDetails,
        [color]: { ...defaultColorwayDetails },
      },
    }));
    setVariants((current) =>
      mergeVariants(current, colors, product.sizes, product.skuPrefix),
    );
    setNewColor("");
  }

  function addSize() {
    if (!newSize.trim()) return;
    const size = newSize.trim().toUpperCase();
    if (
      product.sizes.some((value) => value.toLowerCase() === size.toLowerCase())
    )
      return;
    const sizes = [...product.sizes, size];
    setProduct((current) => ({ ...current, sizes }));
    setVariants((current) =>
      mergeVariants(current, product.colors, sizes, product.skuPrefix),
    );
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
        "SEO Title",
        "SEO Description",
      ],
      ...variants.map((variant) => [
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

  function downloadExport(filename: string, content: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportProductMaster() {
    const headers = [
      "Handle",
      "Title",
      "Vendor",
      "Type",
      "Fabric",
      "Composition",
      "Fit",
      "Compression",
      "Stretch",
      "Support",
      "Rise",
      "Length",
      "Activity",
      "Model Height",
      "Model Size",
      "Care Instructions",
      "Country Of Origin",
      "SKU",
      "Color",
      "Size",
      "Price",
      "Compare At Price",
      "Cost",
      "Stock",
      "Weight",
      "Barcode",
    ];
    const rows = variants.map((variant) => [
      product.handle,
      product.title,
      product.vendor,
      product.productType,
      product.specs.fabric,
      product.specs.composition,
      product.specs.fit,
      product.specs.compression,
      product.specs.stretch,
      product.specs.support,
      product.specs.rise,
      product.specs.length,
      product.specs.activity,
      product.specs.modelHeight,
      product.specs.modelSize,
      product.specs.careInstructions,
      product.specs.countryOfOrigin,
      variant.sku,
      variant.color,
      variant.size,
      variant.price,
      variant.compareAtPrice,
      variant.cost,
      variant.stock,
      variant.weight,
      variant.barcode,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    downloadExport(
      `${product.handle || "product"}-master.csv`,
      csv,
      "text/csv;charset=utf-8",
    );
  }

  function exportJson() {
    downloadExport(
      `${product.handle || "product"}.json`,
      JSON.stringify({ product, variants }, null, 2),
      "application/json;charset=utf-8",
    );
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
                onRemove={(value) => {
                  const colors = product.colors.filter(
                    (color) => color !== value,
                  );
                  setProduct((current) => {
                    const colorwayDetails = { ...current.colorwayDetails };
                    delete colorwayDetails[value];
                    return { ...current, colors, colorwayDetails };
                  });
                  setVariants((current) =>
                    mergeVariants(
                      current,
                      colors,
                      product.sizes,
                      product.skuPrefix,
                    ),
                  );
                }}
              />
              <ChipEditor
                label="SIZES"
                values={product.sizes}
                inputValue={newSize}
                setInputValue={setNewSize}
                onAdd={addSize}
                onRemove={(value) => {
                  const sizes = product.sizes.filter((size) => size !== value);
                  setProduct((current) => ({ ...current, sizes }));
                  setVariants((current) =>
                    mergeVariants(
                      current,
                      product.colors,
                      sizes,
                      product.skuPrefix,
                    ),
                  );
                }}
              />
              <div className="space-y-6 border-t border-[#ded6ca] pt-8">
                <p className="micro-label">COLORWAY AVAILABILITY</p>
                {product.colors.map((color) => {
                  const details =
                    product.colorwayDetails[color] ?? defaultColorwayDetails;
                  const updateColorway = (changes: Partial<ColorwayDetails>) =>
                    setProduct((current) => ({
                      ...current,
                      colorwayDetails: {
                        ...current.colorwayDetails,
                        [color]: { ...details, ...changes },
                      },
                    }));

                  return (
                    <div key={color} className="soft-card space-y-4 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-lg font-medium">{color}</p>
                        <select
                          className="field max-w-52"
                          value={details.status}
                          onChange={(event) =>
                            updateColorway({
                              status: event.target
                                .value as typeof details.status,
                            })
                          }
                          aria-label={`${color} status`}
                        >
                          <option value="coming_soon">Coming Soon</option>
                          <option value="available">Available</option>
                          <option value="low_stock">Low Stock</option>
                          <option value="sold_out">Sold Out</option>
                          <option value="preorder">Preorder</option>
                          <option value="restocked">Restocked</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      <div className="flex flex-wrap gap-5 text-sm">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={details.isPermanent}
                            onChange={(event) =>
                              updateColorway({
                                isPermanent: event.target.checked,
                              })
                            }
                          />{" "}
                          Permanent
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={details.isLimited}
                            onChange={(event) =>
                              updateColorway({
                                isLimited: event.target.checked,
                              })
                            }
                          />{" "}
                          Limited
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={details.preorderEnabled}
                            onChange={(event) =>
                              updateColorway({
                                preorderEnabled: event.target.checked,
                                status: event.target.checked
                                  ? "preorder"
                                  : details.status,
                              })
                            }
                          />{" "}
                          Preorder
                        </label>
                      </div>
                      {details.preorderEnabled && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <TextField
                            label="PREORDER SHIPPING ESTIMATE"
                            value={details.preorderShippingEstimate}
                            onChange={(value) =>
                              updateColorway({
                                preorderShippingEstimate: value,
                              })
                            }
                          />
                          <TextArea
                            label="PREORDER MESSAGE"
                            value={details.preorderMessage}
                            rows={2}
                            onChange={(value) =>
                              updateColorway({ preorderMessage: value })
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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

          {/* {step === 3 && (
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
          )} */}

          {step === 3 && (
            <BuilderSection title="Product Details">
              <p className="max-w-2xl text-sm leading-6 text-[#746d64]">
                Tell us what makes this piece feel and perform the way it does.
                These details prepare the product for the REP.MOVEMENT catalog.
              </p>
              <div className="grid gap-8 md:grid-cols-2">
                {specFields.map(([field, label]) =>
                  field === "careInstructions" ? (
                    <TextArea
                      key={field}
                      label={label}
                      value={product.specs[field]}
                      onChange={(value) =>
                        setProduct((current) => ({
                          ...current,
                          specs: { ...current.specs, [field]: value },
                        }))
                      }
                    />
                  ) : (
                    <TextField
                      key={field}
                      label={label}
                      value={product.specs[field]}
                      onChange={(value) =>
                        setProduct((current) => ({
                          ...current,
                          specs: { ...current.specs, [field]: value },
                        }))
                      }
                    />
                  ),
                )}
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
              {completionResult.missing.length > 0 && (
                <div className="soft-card border-[#b58b65] p-6">
                  <p className="micro-label">STILL NEEDED</p>
                  <ul className="mt-4 space-y-2 text-sm text-[#62594f]">
                    {completionResult.missing.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="text-[#9b5f31]">!</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <ChipEditor
                label="TAGS"
                values={product.tags}
                inputValue={newTag}
                setInputValue={setNewTag}
                onAdd={() => {
                  if (!newTag.trim()) return;
                  if (
                    product.tags.some(
                      (tag) =>
                        tag.toLowerCase() === newTag.trim().toLowerCase(),
                    )
                  )
                    return;
                  setProduct((current) => ({
                    ...current,
                    tags: [...current.tags, newTag.trim()],
                  }));
                  setNewTag("");
                }}
                onRemove={(value) =>
                  setProduct((current) => ({
                    ...current,
                    tags: current.tags.filter((tag) => tag !== value),
                  }))
                }
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Button type="button" variant="secondary" onClick={exportCsv}>
                  <Download className="h-4 w-4" /> EXPORT SHOPIFY CSV
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={exportProductMaster}
                >
                  <Download className="h-4 w-4" /> EXPORT MASTER CSV
                </Button>
                <Button type="button" variant="secondary" onClick={exportJson}>
                  <Download className="h-4 w-4" /> EXPORT JSON
                </Button>
                <Button
                  type="button"
                  disabled={isPending || !isReadyToSubmit}
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
  onRemove,
}: {
  label: string;
  values: string[];
  inputValue: string;
  setInputValue: (value: string) => void;
  onAdd: () => void;
  onRemove?: (value: string) => void;
}) {
  return (
    <div>
      <p className="micro-label">{label}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-2 rounded-full border border-[#d8d0c5] px-4 py-2 text-sm"
          >
            {value}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(value)}
                aria-label={`Remove ${value}`}
                className="text-[#746d64] transition hover:text-[#241f1a]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
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
