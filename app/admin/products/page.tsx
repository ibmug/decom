import { getProductsPaginated, getProductsTotalCount } from "@/lib/actions/product.actions";
import { Metadata } from "next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatId } from "@/lib/utils/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UICatalogProduct } from "@/types";
import { storeProductToUIStoreProduct, toUICatalogProduct } from "@/lib/utils/transformers";
import Pagination from "@/components/shared/pagination";
import DeleteDialog from "@/components/shared/delete-dialog";

export const metadata: Metadata = {
  title: "Admin Products",
};

// You can later wire up real pagination param from URL
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;

const AdminProductsPage = async () => {
  const [productsRaw, totalCount] = await Promise.all([
    getProductsPaginated(DEFAULT_PAGE, DEFAULT_LIMIT),
    getProductsTotalCount()
  ]);

  const viewProducts: UICatalogProduct[] = [];

 for (const p of productsRaw) {
  try {
    const uiProduct = storeProductToUIStoreProduct(p);
    if (!uiProduct) continue;

    const transformed = toUICatalogProduct(uiProduct);
    viewProducts.push(transformed);
  } catch (err) {
    console.error("Skipping product transform error:", p.id, err);
  }
}

  const getPrice = (product: UICatalogProduct) => product.price;
  const getStock = (product: UICatalogProduct) => product.stock;

  return (
    <div className="space-y-2">
      <h2 className="h2-bold">Products</h2>

      {viewProducts.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{formatId(product.id)}</TableCell>
                  <TableCell>{product.type === "ACCESSORY" ? product.accessory.name : product.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(getPrice(product))}</TableCell>
                  <TableCell>{getStock(product)}</TableCell>
                  <TableCell>{product.type === "ACCESSORY" ? product.rating ?? "-" : "-"}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/products/${product.id}`}>Edit</Link>
                    </Button>
                    <DeleteDialog id={product.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination page={DEFAULT_PAGE} totalPages={Math.ceil(totalCount / DEFAULT_LIMIT)} />
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
