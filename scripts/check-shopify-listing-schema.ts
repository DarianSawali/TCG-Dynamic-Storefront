import "dotenv/config";
import { adminQuery } from "../src/lib/shopify/admin";

type InputType = { inputFields: Array<{ name: string }> };

async function main() {
  const data = await adminQuery<{
    productSet: InputType;
    variant: InputType;
    inventory: InputType;
    identifiers: InputType;
  }>(/* GraphQL */ `
    query ListingCreationSchema {
      productSet: __type(name: "ProductSetInput") { inputFields { name } }
      variant: __type(name: "ProductVariantSetInput") { inputFields { name } }
      inventory: __type(name: "InventoryItemInput") { inputFields { name } }
      identifiers: __type(name: "ProductSetIdentifiers") { inputFields { name } }
    }
  `);

  const expected = {
    productSet: [
      "descriptionHtml",
      "files",
      "handle",
      "productOptions",
      "status",
      "title",
      "variants",
    ],
    variant: [
      "inventoryItem",
      "inventoryPolicy",
      "optionValues",
      "position",
      "price",
      "published",
      "sku",
      "taxable",
    ],
    inventory: ["requiresShipping", "sku", "tracked"],
    identifiers: ["handle"],
  } as const;

  for (const [type, fields] of Object.entries(expected)) {
    const actual = new Set(data[type as keyof typeof data].inputFields.map((field) => field.name));
    const missing = fields.filter((field) => !actual.has(field));
    if (missing.length) {
      throw new Error(`${type} is missing required fields: ${missing.join(", ")}`);
    }
  }

  console.log("Shopify listing creation schema is compatible.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
