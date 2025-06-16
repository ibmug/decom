import CardDisplay from "../CardDisplay/card-display";
import AccessoryDisplay from "../AccessoryDisplay/accessory-display";
import { UIStoreProduct } from "@/types";
import { toUICatalogProduct } from "@/lib/utils/transformers";

const ProductList = ({
  data,
  title,
  limit,
}: {
  data: UIStoreProduct[];
  title?: string;
  limit?: number;
}) => {
  const limitedData = limit ? data.slice(0, limit) : data;

  return (
    <div className="my-10">
      <h2 className="h2-bold mb-4">{title}</h2>

      {data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {limitedData.map((product) => {
            const catalogProduct = toUICatalogProduct(product);

            if (catalogProduct.type === "CARD") {
              return (
                <CardDisplay
                  key={catalogProduct.id}
                  product={catalogProduct}
                  session={null}
                />
              );
            }

            if (catalogProduct.type === "ACCESSORY") {
              return (
                <AccessoryDisplay
                  key={catalogProduct.id}
                  product={catalogProduct}
                  session={null}
                />
              );
            }

            return null;
          })}
        </div>
      ) : (
        <div>
          <p> WE ARE OUT OF STOCK</p>
        </div>
      )}
    </div>
  );
};

export default ProductList;
